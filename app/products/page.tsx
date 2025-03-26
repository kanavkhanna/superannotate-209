"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, PlusIcon, Trash2, BookmarkIcon, Loader2, Undo2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { productFormSchema } from "@/lib/schemas"
import type * as z from "zod"
import { storage } from "@/lib/storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Product {
  id: number
  name: string
  brand: string
  category: string
  notes: string
  image: string
}

// Default products if none in storage
const defaultProducts = [
  {
    id: 1,
    name: "Gentle Cleanser",
    brand: "SkinCare Co",
    category: "cleanser",
    notes: "Great for sensitive skin, doesn't dry out my face.",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "Vitamin C Serum",
    brand: "Glow Labs",
    category: "serum",
    notes: "Using in the morning. Noticed brighter skin after 2 weeks.",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Hydrating Moisturizer",
    brand: "Hydra",
    category: "moisturizer",
    notes: "Perfect for winter months when my skin gets dry.",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([])
  const [showUndoButton, setShowUndoButton] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load products from localStorage on initial render
  useEffect(() => {
    const savedProducts = storage.getItem("skintracker-products", null)

    // Only set products from storage, don't use default products
    if (savedProducts !== null) {
      setProducts(savedProducts)
    } else {
      // Initialize with empty array instead of default products
      setProducts([])
      storage.setItem("skintracker-products", [])
    }

    setIsLoading(false)
  }, [])

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (products.length > 0 || products.length === 0) {
      storage.setItem("skintracker-products", products)
    }
  }, [products])

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "cleanser",
      notes: "",
    },
  })

  // Reset form when dialog opens/closes or when editing a product
  const resetForm = (product?: Product) => {
    if (product) {
      form.reset({
        name: product.name,
        brand: product.brand,
        category: product.category,
        notes: product.notes,
      })
    } else {
      form.reset({
        name: "",
        brand: "",
        category: "cleanser",
        notes: "",
      })
    }
  }

  const onSubmit = async (data: z.infer<typeof productFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (editingProduct) {
        setProducts(
          products.map((product) =>
            product.id === editingProduct.id
              ? {
                  ...product,
                  ...data,
                }
              : product,
          ),
        )
        toast.success(`Updated ${data.name}`)
      } else {
        setProducts([
          ...products,
          {
            ...data,
            id: Date.now(),
            image: "/placeholder.svg?height=100&width=100",
          },
        ])
        toast.success(`Added ${data.name}`)
      }

      setIsDialogOpen(false)
      setEditingProduct(null)
      resetForm()
    } catch (error) {
      toast.error("Failed to save product. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id: number) => {
    setProductToDelete(id)
    setShowDeleteDialog(true)
  }

  // Completely revised delete and undo functionality
  const deleteProduct = useCallback(() => {
    if (productToDelete === null) return

    const productIndex = products.findIndex((p) => p.id === productToDelete)
    if (productIndex === -1) return

    const deletedProduct = products[productIndex]
    const newProducts = [...products]
    newProducts.splice(productIndex, 1)

    // Save the deleted product
    setDeletedProducts((prev) => [...prev, deletedProduct])

    // Update the products list
    setProducts(newProducts)
    setShowDeleteDialog(false)
    setShowUndoButton(true)

    toast("Product deleted", {
      description: `${deletedProduct.name} was removed from your inventory`,
      action: {
        label: "Undo",
        onClick: () => {
          // Restore the most recently deleted product
          if (deletedProducts.length > 0 || deletedProduct) {
            const productToRestore = deletedProduct
            setProducts((prev) => [...prev, productToRestore])
            toast.success(`${productToRestore.name} restored`)

            // Remove from deleted products
            setDeletedProducts((prev) => prev.filter((p) => p.id !== productToRestore.id))
          }
        },
      },
    })
  }, [productToDelete, products, deletedProducts])

  // Separate undo button for additional reliability
  const handleUndoLastDelete = useCallback(() => {
    if (deletedProducts.length === 0) return

    // Get the most recently deleted product
    const lastDeletedProduct = deletedProducts[deletedProducts.length - 1]

    // Restore it to the products list
    setProducts((prev) => [...prev, lastDeletedProduct])

    // Remove it from the deleted products list
    setDeletedProducts((prev) => prev.slice(0, -1))

    // Hide undo button if no more deleted products
    if (deletedProducts.length <= 1) {
      setShowUndoButton(false)
    }

    toast.success(`${lastDeletedProduct.name} restored`)
  }, [deletedProducts])

  // Hide undo button when there are no deleted products
  useEffect(() => {
    if (deletedProducts.length === 0) {
      setShowUndoButton(false)
    }
  }, [deletedProducts])

  const editProduct = (product: Product) => {
    setEditingProduct(product)
    resetForm(product)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <PageHeader title="Product Inventory" description="Manage your skincare products and notes" />

        <div className="mb-8 flex justify-between">
          {showUndoButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoLastDelete}
              className="transition-all hover:shadow-md"
            >
              <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Undo Delete
            </Button>
          )}
          <div className={showUndoButton ? "" : "ml-auto"}>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  setEditingProduct(null)
                  resetForm()
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="transition-all hover:shadow-md hover:bg-primary/90">
                  <PlusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-xl">
                    <BookmarkIcon className="mr-2 h-5 w-5 text-primary" />
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Update your product details" : "Add a new product to your inventory"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Product Name</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-primary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Brand</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-primary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="focus-visible:ring-primary">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cleanser">Cleanser</SelectItem>
                              <SelectItem value="toner">Toner</SelectItem>
                              <SelectItem value="serum">Serum</SelectItem>
                              <SelectItem value="moisturizer">Moisturizer</SelectItem>
                              <SelectItem value="sunscreen">Sunscreen</SelectItem>
                              <SelectItem value="mask">Mask</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium">Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add your notes about this product..."
                              className="min-h-[100px] resize-none focus-visible:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false)
                          setEditingProduct(null)
                          resetForm()
                        }}
                        className="border-muted-foreground/20 hover:bg-muted"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="transition-all hover:shadow-md hover:bg-primary/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          `${editingProduct ? "Update" : "Add"} Product`
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/30">
              <div className="flex flex-col items-center space-y-2 text-center">
                <BookmarkIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-muted-foreground font-medium">No products added</p>
                <p className="text-xs text-muted-foreground/70">Add your first product to get started</p>
              </div>
            </div>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden border-muted/40 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">{product.brand}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editProduct(product)}
                        aria-label={`Edit ${product.name}`}
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(product.id)}
                        aria-label={`Delete ${product.name}`}
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted/50">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-3">{product.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the product from your inventory. You can undo this action afterward if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

