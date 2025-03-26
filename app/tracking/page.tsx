"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save, CalendarIcon, Loader2, Edit, Trash2, ListIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { trackingFormSchema } from "@/lib/schemas"
import type * as z from "zod"
import { Skeleton } from "@/components/ui/skeleton"
import { storage } from "@/lib/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

interface Concerns {
  [key: string]: boolean
}

interface TrackingEntry {
  id: number
  date: Date
  skinRating: string
  concerns: Concerns
  notes: string
}

export default function TrackingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [trackingEntries, setTrackingEntries] = useState<TrackingEntry[]>([])
  const [activeTab, setActiveTab] = useState("add")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingEntry, setEditingEntry] = useState<TrackingEntry | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // Add state for deleted entry
  const [deletedEntry, setDeletedEntry] = useState<TrackingEntry | null>(null)

  // Load tracking data from localStorage
  useEffect(() => {
    const savedTrackingEntries = storage.getItem("skintracker-tracking", [])
    // Convert date strings back to Date objects
    const processedEntries = savedTrackingEntries.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date),
    }))
    setTrackingEntries(processedEntries)
    setIsLoading(false)
  }, [])

  // Save tracking data to localStorage whenever it changes
  useEffect(() => {
    if (trackingEntries.length > 0 || trackingEntries.length === 0) {
      storage.setItem("skintracker-tracking", trackingEntries)
    }
  }, [trackingEntries])

  const form = useForm<z.infer<typeof trackingFormSchema>>({
    resolver: zodResolver(trackingFormSchema),
    defaultValues: {
      date: new Date(),
      skinRating: "3",
      concerns: {
        dryness: false,
        oiliness: false,
        acne: false,
        redness: false,
        sensitivity: false,
      },
      notes: "",
    },
  })

  // Reset form when editing entry changes
  useEffect(() => {
    if (editingEntry) {
      form.reset({
        date: new Date(editingEntry.date),
        skinRating: editingEntry.skinRating,
        concerns: editingEntry.concerns,
        notes: editingEntry.notes || "",
      })
    }
  }, [editingEntry, form])

  const toggleConcern = (concern: string) => {
    const currentConcerns = form.getValues("concerns") as Concerns
    form.setValue(
      "concerns",
      {
        ...currentConcerns,
        [concern]: !currentConcerns[concern],
      },
      { shouldDirty: true },
    )
  }

  const onSubmit = async (data: z.infer<typeof trackingFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (editingEntry) {
        // Update existing entry
        const updatedEntries = trackingEntries.map((entry) =>
          entry.id === editingEntry.id ? { ...entry, ...data } : entry,
        )
        setTrackingEntries(updatedEntries)
        toast.success("Tracking entry updated!")
        setEditingEntry(null)
      } else {
        // Add new entry
        // Check if an entry already exists for this date
        const existingEntryIndex = trackingEntries.findIndex(
          (entry) => format(new Date(entry.date), "yyyy-MM-dd") === format(data.date, "yyyy-MM-dd"),
        )

        if (existingEntryIndex !== -1) {
          // Update existing entry for this date
          const updatedEntries = [...trackingEntries]
          updatedEntries[existingEntryIndex] = {
            ...updatedEntries[existingEntryIndex],
            ...data,
            id: updatedEntries[existingEntryIndex].id, // Keep the same ID
          }
          setTrackingEntries(updatedEntries)
          toast.success("Updated existing entry for this date")
        } else {
          // Add new entry
          const newEntry = {
            ...data,
            id: Date.now(),
          }
          setTrackingEntries([...trackingEntries, newEntry])
          toast.success("Skin condition tracking saved!")
        }
      }

      // Reset form
      form.reset({
        date: new Date(),
        skinRating: "3",
        concerns: {
          dryness: false,
          oiliness: false,
          acne: false,
          redness: false,
          sensitivity: false,
        },
        notes: "",
      })

      // Switch to view tab after saving
      setActiveTab("view")
    } catch (error) {
      toast.error("Failed to save tracking data. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEmojiForRating = (rating: string): string => {
    switch (rating) {
      case "1":
        return "😞"
      case "2":
        return "🙁"
      case "3":
        return "😐"
      case "4":
        return "🙂"
      case "5":
        return "😄"
      default:
        return "❓"
    }
  }

  const getColorForRating = (rating: string): string => {
    switch (rating) {
      case "1":
        return "bg-destructive/20 text-destructive dark:bg-destructive/10"
      case "2":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
      case "3":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "4":
        return "bg-lime-100 text-lime-700 dark:bg-lime-900/20 dark:text-lime-400"
      case "5":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const editEntry = (entry: TrackingEntry) => {
    setEditingEntry(entry)
    setActiveTab("add")
  }

  const confirmDelete = (id: number) => {
    setEntryToDelete(id)
    setShowDeleteDialog(true)
  }

  // Update the deleteEntry function to use Sonner toast with undo
  const deleteEntry = () => {
    if (entryToDelete === null) return

    // Find the entry to be deleted
    const entryToBeDeleted = trackingEntries.find((entry) => entry.id === entryToDelete)
    if (!entryToBeDeleted) return

    // Store the deleted entry for potential undo
    setDeletedEntry(entryToBeDeleted)

    // Remove the entry from the list
    const updatedEntries = trackingEntries.filter((entry) => entry.id !== entryToDelete)
    setTrackingEntries(updatedEntries)
    setShowDeleteDialog(false)

    // Show toast with undo option
    toast("Entry deleted", {
      description: `Entry for ${format(new Date(entryToBeDeleted.date), "MMMM d, yyyy")} was removed`,
      action: {
        label: "Undo",
        onClick: () => {
          // Restore the deleted entry
          if (deletedEntry) {
            setTrackingEntries((prev) => [...prev, deletedEntry])
            setDeletedEntry(null)
            toast.success("Entry restored")
          }
        },
      },
    })
  }

  // Get entry for selected date
  const getEntryForDate = (date: Date) => {
    return trackingEntries.find((entry) => format(new Date(entry.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
  }

  // Handle date selection in view tab
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const entry = getEntryForDate(date)
    if (entry) {
      // If entry exists for this date, show it
    } else {
      toast.info("No tracking data for this date")
    }
  }

  // Get active concerns from an entry
  const getActiveConcerns = (concerns: Concerns) => {
    return Object.entries(concerns)
      .filter(([_, isActive]) => isActive)
      .map(([concern]) => concern)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <Card className="border-muted/40 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex space-x-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-10 w-10 rounded-full" />
                      ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-md" />
                    ))}
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4">
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
        <PageHeader title="Skin Condition Tracking" description="Record how your skin looks and feels today" />

        <Card className="border-muted/40 shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                  Track Your Skin Condition
                </CardTitle>
                <CardDescription>Record and view your skin condition data</CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto mt-4 sm:mt-0">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger
                    value="add"
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    {editingEntry ? "Edit Entry" : "Add Entry"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="view"
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    View Entries
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="add" className="m-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-8 p-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Date</FormLabel>
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const selectedDate = e.target.value ? new Date(e.target.value) : new Date()
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)

                                  // Prevent selecting future dates
                                  if (selectedDate > today) {
                                    toast.error("Cannot select future dates")
                                    return
                                  }

                                  field.onChange(selectedDate)
                                }}
                                className="w-full"
                                max={format(new Date(), "yyyy-MM-dd")}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-10 w-10">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="sr-only">Open calendar</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    className="rounded-md border"
                                    disabled={(date) => date > new Date()}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <p className="text-xs text-muted-foreground">Select a date for this tracking entry</p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skinRating"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel id="skin-rating-label" className="text-sm font-medium">
                            Overall Skin Rating
                          </FormLabel>
                          <div className="flex flex-col items-center space-y-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm border bg-card">
                              {getEmojiForRating(field.value)}
                            </div>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex space-x-2"
                                aria-labelledby="skin-rating-label"
                              >
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem value="1" id="r1" className="sr-only" />
                                  <Label
                                    htmlFor="r1"
                                    className={`cursor-pointer rounded-full p-2 transition-colors ${field.value === "1" ? getColorForRating("1") : "hover:bg-muted"}`}
                                  >
                                    😞
                                  </Label>
                                  <span className="mt-1 text-xs text-muted-foreground">Poor</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem value="2" id="r2" className="sr-only" />
                                  <Label
                                    htmlFor="r2"
                                    className={`cursor-pointer rounded-full p-2 transition-colors ${field.value === "2" ? getColorForRating("2") : "hover:bg-muted"}`}
                                  >
                                    🙁
                                  </Label>
                                  <span className="mt-1 text-xs text-muted-foreground">Fair</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem value="3" id="r3" className="sr-only" />
                                  <Label
                                    htmlFor="r3"
                                    className={`cursor-pointer rounded-full p-2 transition-colors ${field.value === "3" ? getColorForRating("3") : "hover:bg-muted"}`}
                                  >
                                    😐
                                  </Label>
                                  <span className="mt-1 text-xs text-muted-foreground">Good</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem value="4" id="r4" className="sr-only" />
                                  <Label
                                    htmlFor="r4"
                                    className={`cursor-pointer rounded-full p-2 transition-colors ${field.value === "4" ? getColorForRating("4") : "hover:bg-muted"}`}
                                  >
                                    🙂
                                  </Label>
                                  <span className="mt-1 text-xs text-muted-foreground">Great</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <RadioGroupItem value="5" id="r5" className="sr-only" />
                                  <Label
                                    htmlFor="r5"
                                    className={`cursor-pointer rounded-full p-2 transition-colors ${field.value === "5" ? getColorForRating("5") : "hover:bg-muted"}`}
                                  >
                                    😄
                                  </Label>
                                  <span className="mt-1 text-xs text-muted-foreground">Excellent</span>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="concerns"
                      render={() => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Skin Concerns</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {["dryness", "oiliness", "acne", "redness", "sensitivity"].map((concern) => {
                              const concerns = form.getValues("concerns") as Concerns
                              return (
                                <Button
                                  key={concern}
                                  type="button"
                                  variant={concerns[concern] ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleConcern(concern)}
                                  className={
                                    concerns[concern]
                                      ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                      : "hover:bg-muted"
                                  }
                                >
                                  {concern.charAt(0).toUpperCase() + concern.slice(1)}
                                </Button>
                              )
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific observations about your skin today?"
                              className="min-h-[120px] resize-none focus-visible:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="bg-muted/30 px-6 py-4">
                    {editingEntry && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingEntry(null)
                          form.reset({
                            date: new Date(),
                            skinRating: "3",
                            concerns: {
                              dryness: false,
                              oiliness: false,
                              acne: false,
                              redness: false,
                              sensitivity: false,
                            },
                            notes: "",
                          })
                        }}
                        className="mr-auto"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
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
                          {editingEntry ? "Update Entry" : "Save Entry"}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="view" className="m-0">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Select Date</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && handleDateSelect(date)}
                      className="rounded-md border"
                      disabled={(date) => date > new Date()}
                      // Highlight dates with entries
                      modifiers={{
                        highlighted: trackingEntries.map((entry) => new Date(entry.date)),
                        today: [new Date()],
                        selected: [selectedDate],
                      }}
                      modifiersStyles={{
                        highlighted: { backgroundColor: "hsl(var(--primary) / 0.1)" },
                        today: { backgroundColor: "hsl(var(--secondary) / 0.2)", fontWeight: "bold" },
                        selected: {
                          backgroundColor: "hsl(var(--primary) / 0.2)",
                          color: "hsl(var(--primary))",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Entry Details</h3>
                    {trackingEntries.length === 0 ? (
                      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30">
                        <div className="flex flex-col items-center space-y-2 text-center">
                          <ListIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                          <p className="text-muted-foreground font-medium">No entries yet</p>
                          <p className="text-xs text-muted-foreground/70">Add your first entry to get started</p>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const entry = getEntryForDate(selectedDate)

                        if (!entry) {
                          return (
                            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30">
                              <div className="flex flex-col items-center space-y-2 text-center">
                                <CalendarIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                                <p className="text-muted-foreground font-medium">No entry for this date</p>
                                <p className="text-xs text-muted-foreground/70">
                                  Select a different date or add an entry
                                </p>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-medium">{format(new Date(entry.date), "MMMM d, yyyy")}</h4>
                                <p className="text-sm text-muted-foreground">Skin condition tracking</p>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editEntry(entry)}
                                  aria-label="Edit entry"
                                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDelete(entry.id)}
                                  aria-label="Delete entry"
                                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center">
                                <div
                                  className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${getColorForRating(entry.skinRating)}`}
                                >
                                  {getEmojiForRating(entry.skinRating)}
                                </div>
                                <div>
                                  <span className="font-medium">Rating: {entry.skinRating}/5</span>
                                </div>
                              </div>

                              <div>
                                <h5 className="text-sm font-medium mb-2">Concerns:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {getActiveConcerns(entry.concerns).length > 0 ? (
                                    getActiveConcerns(entry.concerns).map((concern) => (
                                      <Badge key={concern} variant="secondary" className="bg-primary/10 text-primary">
                                        {concern.charAt(0).toUpperCase() + concern.slice(1)}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No concerns recorded</span>
                                  )}
                                </div>
                              </div>

                              {entry.notes && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Notes:</h5>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete this tracking entry. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteEntry}
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

