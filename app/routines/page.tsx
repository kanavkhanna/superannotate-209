"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, Sun, Moon, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { routineFormSchema } from "@/lib/schemas"
import type * as z from "zod"
import { Skeleton } from "@/components/ui/skeleton"
import { storage } from "@/lib/storage"
import Link from "next/link"

interface Product {
  id: number
  name: string
  isUsed: boolean
}

export default function RoutinesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("morning")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  // Load products from localStorage
  useEffect(() => {
    const loadProducts = () => {
      // Get products from localStorage without using default products
      const savedProducts = storage.getItem("skintracker-products", [])
      setAvailableProducts(savedProducts)
      setIsLoading(false)
    }

    // Load products immediately
    loadProducts()

    // Create a custom event listener for product changes
    const handleStorageChange = (e) => {
      if (e.key === "skintracker-products" || e.key === null) {
        loadProducts()
      }
    }

    // Listen for storage events (when another tab changes localStorage)
    window.addEventListener("storage", handleStorageChange)

    // Listen for our custom event (when this tab changes localStorage)
    window.addEventListener("skintracker-storage-update", loadProducts)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("skintracker-storage-update", loadProducts)
    }
  }, [])

  // Create initial product lists based on available products
  const createInitialProducts = () => {
    if (!availableProducts || availableProducts.length === 0) {
      return []
    }

    return availableProducts.map((product) => ({
      id: product.id,
      name: product.name,
      isUsed: false,
    }))
  }

  // Create forms for morning and evening routines
  const morningForm = useForm<z.infer<typeof routineFormSchema>>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      products: [],
      notes: "",
    },
  })

  const eveningForm = useForm<z.infer<typeof routineFormSchema>>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      products: [],
      notes: "",
    },
  })

  // Update form values when available products change
  useEffect(() => {
    if (availableProducts.length > 0) {
      const productsList = createInitialProducts()
      morningForm.setValue("products", productsList)
      eveningForm.setValue("products", productsList)
    } else {
      morningForm.setValue("products", [])
      eveningForm.setValue("products", [])
    }
  }, [availableProducts])

  const toggleProduct = (time: string, id: number) => {
    if (time === "morning") {
      const currentProducts = morningForm.getValues("products")
      const updatedProducts = currentProducts.map((product) =>
        product.id === id ? { ...product, isUsed: !product.isUsed } : product,
      )
      morningForm.setValue("products", updatedProducts, { shouldDirty: true })
    } else {
      const currentProducts = eveningForm.getValues("products")
      const updatedProducts = currentProducts.map((product) =>
        product.id === id ? { ...product, isUsed: !product.isUsed } : product,
      )
      eveningForm.setValue("products", updatedProducts, { shouldDirty: true })
    }
  }

  const morningProducts = morningForm.watch("products")
  const eveningProducts = eveningForm.watch("products")

  const onSubmit = async (time: string) => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      const today = new Date()

      if (time === "morning") {
        const data = morningForm.getValues()

        // Create routine entry with date and time
        const routineEntry = {
          ...data,
          date: today,
          time: "morning",
        }

        // Get existing routines
        const existingRoutines = storage.getItem("skintracker-routines", [])

        // Add new routine
        storage.setItem("skintracker-routines", [...existingRoutines, routineEntry])

        toast.success("Morning routine saved successfully!")
      } else {
        const data = eveningForm.getValues()

        // Create routine entry with date and time
        const routineEntry = {
          ...data,
          date: today,
          time: "evening",
        }

        // Get existing routines
        const existingRoutines = storage.getItem("skintracker-routines", [])

        // Add new routine
        storage.setItem("skintracker-routines", [...existingRoutines, routineEntry])

        toast.success("Evening routine saved successfully!")
      }

      router.push("/")
    } catch (error) {
      toast.error("Failed to save routine. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
          </div>

          <Card className="border-muted/40 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-8 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-6 pt-2">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-0">
              <Skeleton className="h-10 w-32 ml-auto" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <PageHeader title="Daily Routine" />

        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold sm:text-2xl">Log Your Routine</CardTitle>
                <CardDescription className="mt-1">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                Today
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="morning" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="morning"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Morning Routine
                </TabsTrigger>
                <TabsTrigger
                  value="evening"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Evening Routine
                </TabsTrigger>
              </TabsList>

              <TabsContent value="morning" className="space-y-6 pt-2">
                <Form {...morningForm}>
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Products Used</h3>
                    {morningProducts.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <p className="text-muted-foreground font-medium">No products available</p>
                          <p className="text-xs text-muted-foreground/70">
                            Please add products in the Products section first
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href="/products">Add Products</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {morningProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleProduct("morning", product.id)}
                          >
                            <Checkbox
                              id={`morning-product-${product.id}`}
                              checked={product.isUsed}
                              onCheckedChange={() => toggleProduct("morning", product.id)}
                              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label
                              htmlFor={`morning-product-${product.id}`}
                              className="flex-1 cursor-pointer font-medium"
                            >
                              {product.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={morningForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-2 mt-6">
                        <FormLabel className="text-sm font-medium">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How did your skin feel? Any reactions?"
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </TabsContent>

              <TabsContent value="evening" className="space-y-6 pt-2">
                <Form {...eveningForm}>
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Products Used</h3>
                    {eveningProducts.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <p className="text-muted-foreground font-medium">No products available</p>
                          <p className="text-xs text-muted-foreground/70">
                            Please add products in the Products section first
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href="/products">Add Products</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {eveningProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleProduct("evening", product.id)}
                          >
                            <Checkbox
                              id={`evening-product-${product.id}`}
                              checked={product.isUsed}
                              onCheckedChange={() => toggleProduct("evening", product.id)}
                              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label
                              htmlFor={`evening-product-${product.id}`}
                              className="flex-1 cursor-pointer font-medium"
                            >
                              {product.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={eveningForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-2 mt-6">
                        <FormLabel className="text-sm font-medium">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How did your skin feel? Any reactions?"
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-0">
            <Button
              onClick={() => onSubmit(activeTab)}
              className="ml-auto transition-all hover:shadow-md hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save Routine
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

