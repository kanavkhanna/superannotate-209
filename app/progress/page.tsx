"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  History,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { storage } from "@/lib/storage"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, addDays } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WeeklyData {
  ratings: number[]
  routineAdherence: {
    overall: number
    morning: number
    evening: number
    completedDays: {
      date: Date
      morning: boolean
      evening: boolean
    }[]
  }
  topConcerns: string[]
  daysLogged: number
  mostUsedProducts: { name: string; days: number }[]
  averageRating: number
  ratingTrend: "up" | "down" | "stable"
}

// Default data for demonstration when no tracking data exists
const defaultWeeklyData: WeeklyData = {
  ratings: [0, 0, 0, 0, 0, 0, 0],
  routineAdherence: {
    overall: 0,
    morning: 0,
    evening: 0,
    completedDays: [],
  },
  topConcerns: [],
  daysLogged: 0,
  mostUsedProducts: [],
  averageRating: 0,
  ratingTrend: "stable",
}

// Date ranges for each week
const getWeekDateRange = (date: Date): string => {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Start on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // End on Sunday
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

export default function ProgressPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(defaultWeeklyData)
  const [trackingEntries, setTrackingEntries] = useState<any[]>([])
  const [routineEntries, setRoutineEntries] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previousWeekAvg, setPreviousWeekAvg] = useState<number>(0)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [historyTab, setHistoryTab] = useState("tracking")

  // Load data from localStorage
  useEffect(() => {
    // Get tracking data from localStorage if available
    const savedTrackingEntries = storage.getItem("skintracker-tracking", [])
    const savedRoutines = storage.getItem("skintracker-routines", [])
    const savedProducts = storage.getItem("skintracker-products", [])

    // Convert date strings to Date objects
    const processedEntries = savedTrackingEntries.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date),
    }))

    // Process routine entries to ensure dates are Date objects
    const processedRoutines = savedRoutines
      ? savedRoutines.map((routine: any) => ({
          ...routine,
          date: routine.date ? new Date(routine.date) : null,
        }))
      : []

    setTrackingEntries(processedEntries)
    setRoutineEntries(processedRoutines)
    setProducts(savedProducts || [])
    setIsLoading(false)
  }, [])

  // Calculate weekly data based on tracking entries and current week
  useEffect(() => {
    // Define the current week interval
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Start on Monday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // End on Sunday

    // Define the previous week interval for trend calculation
    const prevWeekStart = startOfWeek(subWeeks(currentWeek, 1), { weekStartsOn: 1 })
    const prevWeekEnd = endOfWeek(subWeeks(currentWeek, 1), { weekStartsOn: 1 })

    // Filter entries for the current week
    const weekEntries = trackingEntries.filter((entry) =>
      isWithinInterval(new Date(entry.date), { start: weekStart, end: weekEnd }),
    )

    // Filter entries for the previous week (for trend calculation)
    const prevWeekEntries = trackingEntries.filter((entry) =>
      isWithinInterval(new Date(entry.date), { start: prevWeekStart, end: prevWeekEnd }),
    )

    // Initialize ratings array with zeros for each day of the week
    const ratings = [0, 0, 0, 0, 0, 0, 0]

    // Map of day index (0 = Monday, 6 = Sunday) to entries
    const entriesByDay = new Map()

    // Process entries
    weekEntries.forEach((entry) => {
      const date = new Date(entry.date)
      const dayIndex = (date.getDay() + 6) % 7 // Convert Sunday=0 to Sunday=6

      // Store entry by day
      entriesByDay.set(dayIndex, entry)

      // Set rating for the day
      ratings[dayIndex] = Number.parseInt(entry.skinRating, 10)
    })

    // Count active concerns
    const concernCounts: Record<string, number> = {}
    weekEntries.forEach((entry) => {
      Object.entries(entry.concerns).forEach(([concern, isActive]) => {
        if (isActive) {
          concernCounts[concern] = (concernCounts[concern] || 0) + 1
        }
      })
    })

    // Sort concerns by frequency
    const topConcerns = Object.entries(concernCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concern]) => concern)

    // Calculate most used products based on routine data
    const productUsage: Record<string, number> = {}

    // Get all routine entries for the current week
    const weekRoutines = routineEntries.filter((routine: any) => {
      if (!routine.date) return false
      const routineDate = new Date(routine.date)
      return isWithinInterval(routineDate, { start: weekStart, end: weekEnd })
    })

    // Count product usage from actual routine data
    weekRoutines.forEach((routine: any) => {
      if (routine.products) {
        routine.products.forEach((product: any) => {
          if (product.isUsed) {
            productUsage[product.name] = (productUsage[product.name] || 0) + 1
          }
        })
      }
    })

    // Sort products by usage and take top 3
    const mostUsedProducts = Object.entries(productUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, days]) => ({ name, days }))

    // Calculate routine adherence based on actual routine data
    // Create an array of days in the week
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(weekStart, i))
    }

    // Track completed routines for each day
    const completedDays = weekDays.map((day) => {
      const dayFormatted = format(day, "yyyy-MM-dd")

      // Check if morning routine exists for this day
      const morningRoutine = routineEntries.find(
        (routine) =>
          routine.time === "morning" && routine.date && format(new Date(routine.date), "yyyy-MM-dd") === dayFormatted,
      )

      // Check if evening routine exists for this day
      const eveningRoutine = routineEntries.find(
        (routine) =>
          routine.time === "evening" && routine.date && format(new Date(routine.date), "yyyy-MM-dd") === dayFormatted,
      )

      return {
        date: day,
        morning: !!morningRoutine,
        evening: !!eveningRoutine,
      }
    })

    // Calculate adherence percentages
    const morningCompleted = completedDays.filter((day) => day.morning).length
    const eveningCompleted = completedDays.filter((day) => day.evening).length
    const totalCompleted = morningCompleted + eveningCompleted

    const morningAdherence = Math.round((morningCompleted / 7) * 100)
    const eveningAdherence = Math.round((eveningCompleted / 7) * 100)
    const overallAdherence = Math.round((totalCompleted / 14) * 100) // 14 = 7 days * 2 routines per day

    const routineAdherence = {
      overall: overallAdherence,
      morning: morningAdherence,
      evening: eveningAdherence,
      completedDays,
    }

    // Calculate average rating (excluding zeros)
    const validRatings = ratings.filter((r) => r > 0)
    const averageRating =
      validRatings.length === 0 ? 0 : validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length

    // Calculate previous week's average rating
    const prevValidRatings = prevWeekEntries.map((entry) => Number.parseInt(entry.skinRating, 10))
    const prevAverageRating =
      prevValidRatings.length === 0
        ? 0
        : prevValidRatings.reduce((sum, rating) => sum + rating, 0) / prevValidRatings.length

    setPreviousWeekAvg(prevAverageRating)

    // Determine rating trend
    let ratingTrend: "up" | "down" | "stable" = "stable"
    if (averageRating > prevAverageRating && prevAverageRating > 0) {
      ratingTrend = "up"
    } else if (averageRating < prevAverageRating && prevAverageRating > 0) {
      ratingTrend = "down"
    }

    // Update weekly data
    setWeeklyData({
      ratings,
      routineAdherence,
      topConcerns,
      daysLogged: entriesByDay.size,
      mostUsedProducts,
      averageRating,
      ratingTrend,
    })
  }, [trackingEntries, currentWeek, routineEntries, products])

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const getEmojiForRating = (rating: number): string => {
    switch (rating) {
      case 1:
        return "😞"
      case 2:
        return "🙁"
      case 3:
        return "😐"
      case 4:
        return "🙂"
      case 5:
        return "😄"
      default:
        return "❓"
    }
  }

  const getColorForRating = (rating: number): string => {
    switch (rating) {
      case 1:
        return "bg-destructive/20 text-destructive dark:bg-destructive/10"
      case 2:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
      case 3:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
      case 4:
        return "bg-lime-100 text-lime-700 dark:bg-lime-900/20 dark:text-lime-400"
      case 5:
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1))
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeek, 1)
    if (nextWeek <= new Date()) {
      setCurrentWeek(nextWeek)
    }
  }

  // Check if current week is this week
  const isCurrentWeekThisWeek = () => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 })

    return isWithinInterval(currentWeek, {
      start: thisWeekStart,
      end: thisWeekEnd,
    })
  }

  // Get trend icon and color based on rating trend
  const getTrendInfo = () => {
    if (weeklyData.ratingTrend === "up") {
      return {
        icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
        text: "Improving",
        color: "text-green-500",
      }
    } else if (weeklyData.ratingTrend === "down") {
      return {
        icon: <ArrowDownRight className="h-4 w-4 text-red-500" />,
        text: "Declining",
        color: "text-red-500",
      }
    } else {
      return {
        icon: <Minus className="h-4 w-4 text-yellow-500" />,
        text: "Stable",
        color: "text-yellow-500",
      }
    }
  }

  const trendInfo = getTrendInfo()

  // Sort entries by date (newest first)
  const sortedTrackingEntries = [...trackingEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Sort routines by date (newest first)
  const sortedRoutineEntries = [...routineEntries].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <PageHeader title="Progress Summary" />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowHistoryDialog(true)}
          >
            <History className="h-4 w-4" />
            View History
          </Button>
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              className="h-9 w-9 rounded-full hover:bg-muted"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-[180px] text-center font-medium">
              {isCurrentWeekThisWeek() ? "This Week" : format(currentWeek, "MMM d, yyyy")}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              className="h-9 w-9 rounded-full hover:bg-muted"
              onClick={goToNextWeek}
              disabled={isCurrentWeekThisWeek()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-full text-muted-foreground">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">{getWeekDateRange(currentWeek)}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-muted/40 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Weekly Skin Rating
              </CardTitle>
              <CardDescription>Your daily skin condition ratings</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-end h-48 pt-4">
                {weeklyData.ratings.map((rating, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 ${rating > 0 ? getColorForRating(rating) : "bg-muted text-muted-foreground"}`}
                      aria-label={`Rating ${rating > 0 ? rating : "not recorded"} out of 5 for ${days[index]}`}
                    >
                      {rating > 0 ? getEmojiForRating(rating) : "—"}
                    </div>
                    <div className="text-xs font-medium">{days[index]}</div>
                    <div className="mt-2 h-24 w-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="bg-primary w-full transition-all duration-500"
                        style={{
                          height: rating > 0 ? `${(rating / 5) * 100}%` : "0%",
                          marginTop: rating > 0 ? `${100 - (rating / 5) * 100}%` : "100%",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/40 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Routine Adherence
              </CardTitle>
              <CardDescription>How consistently you followed your routines</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col h-48">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className="relative w-32 h-32"
                    aria-label={`Overall routine adherence: ${weeklyData.routineAdherence.overall}%`}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeDasharray={`${weeklyData.routineAdherence.overall * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{weeklyData.routineAdherence.overall}%</span>
                      <span className="text-xs text-muted-foreground">Overall</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-1">
                      <Sun className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm font-medium">Morning</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${weeklyData.routineAdherence.morning}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1">{weeklyData.routineAdherence.morning}%</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-1">
                      <Moon className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm font-medium">Evening</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${weeklyData.routineAdherence.evening}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1">{weeklyData.routineAdherence.evening}%</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <div className="flex justify-between mb-1">
                    <span>Day</span>
                    <div className="flex space-x-4">
                      <span>AM</span>
                      <span>PM</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {weeklyData.routineAdherence.completedDays.map((day, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{format(day.date, "EEE")}</span>
                        <div className="flex space-x-4">
                          <span>
                            {day.morning ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted" />
                            )}
                          </span>
                          <span>
                            {day.evening ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted" />
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-muted/40 shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center text-xl">
                <Sparkles className="mr-2 h-5 w-5 text-primary" />
                Weekly Insights
              </CardTitle>
              <CardDescription>Summary of your skincare journey this week</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Top Concerns Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Top Concerns</h3>
                  <div className="flex flex-wrap gap-2">
                    {weeklyData.topConcerns.length > 0 ? (
                      weeklyData.topConcerns.map((concern) => (
                        <span
                          key={concern}
                          className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium"
                        >
                          {concern.charAt(0).toUpperCase() + concern.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No concerns recorded</span>
                    )}
                  </div>
                </div>

                {/* Average Rating Section - Enhanced with trend */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Average Rating</h3>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${weeklyData.averageRating > 0 ? getColorForRating(Math.round(weeklyData.averageRating)) : "bg-muted text-muted-foreground"}`}
                      >
                        {weeklyData.averageRating > 0 ? getEmojiForRating(Math.round(weeklyData.averageRating)) : "—"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {weeklyData.averageRating > 0 ? weeklyData.averageRating.toFixed(1) : "—"} / 5.0
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {weeklyData.daysLogged > 0 ? "Based on your ratings" : "No ratings yet"}
                        </span>
                      </div>
                    </div>

                    {/* Trend indicator */}
                    {weeklyData.averageRating > 0 && previousWeekAvg > 0 && (
                      <div className="flex items-center p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center mr-2">
                          <TrendingUp className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-xs font-medium">Trend:</span>
                        </div>
                        <div className="flex items-center">
                          {trendInfo.icon}
                          <span className={`text-xs ml-1 ${trendInfo.color}`}>{trendInfo.text}</span>
                          {previousWeekAvg > 0 && (
                            <span className="text-xs ml-2 text-muted-foreground">
                              vs {previousWeekAvg.toFixed(1)} last week
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Most Used Products Section - Improved */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Most Used Products</h3>
                  {weeklyData.mostUsedProducts.length > 0 ? (
                    <div className="space-y-2 bg-muted/30 p-3 rounded-md">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Product</span>
                        <span>Usage</span>
                      </div>
                      <ul className="space-y-2">
                        {weeklyData.mostUsedProducts.map((product, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                              <span className="font-medium truncate max-w-[150px]">{product.name}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden mr-2">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${(product.days / 7) * 100}%` }}
                                ></div>
                              </div>
                              <Badge variant="outline" className="text-xs font-normal">
                                {product.days} {product.days === 1 ? "time" : "times"}
                              </Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 bg-muted/30 rounded-md">
                      <p className="text-sm text-muted-foreground">No product usage data</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>History Log</DialogTitle>
            <DialogDescription>View your previous tracking and routine entries</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={historyTab} onValueChange={setHistoryTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tracking">Skin Condition</TabsTrigger>
              <TabsTrigger value="routines">Routines</TabsTrigger>
            </TabsList>

            <TabsContent value="tracking" className="mt-4">
              <ScrollArea className="h-[50vh]">
                {sortedTrackingEntries.length > 0 ? (
                  <div className="space-y-4">
                    {sortedTrackingEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{format(new Date(entry.date), "MMMM d, yyyy")}</h3>
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${getColorForRating(Number.parseInt(entry.skinRating))}`}
                          >
                            {getEmojiForRating(Number.parseInt(entry.skinRating))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="text-sm font-medium">Concerns:</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(entry.concerns)
                                .filter(([_, isActive]) => isActive)
                                .map(([concern]) => (
                                  <Badge key={concern} variant="secondary" className="text-xs">
                                    {concern.charAt(0).toUpperCase() + concern.slice(1)}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          {entry.notes && (
                            <div>
                              <h4 className="text-sm font-medium">Notes:</h4>
                              <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No tracking entries found</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="routines" className="mt-4">
              <ScrollArea className="h-[50vh]">
                {sortedRoutineEntries.length > 0 ? (
                  <div className="space-y-4">
                    {sortedRoutineEntries.map((routine, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">
                              {routine.date ? format(new Date(routine.date), "MMMM d, yyyy") : "Undated Entry"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {routine.time === "morning"
                                ? "Morning"
                                : routine.time === "evening"
                                  ? "Evening"
                                  : "Unknown"}{" "}
                              Routine
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {routine.products && routine.products.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium">Products Used:</h4>
                              <ul className="mt-1 space-y-1">
                                {routine.products
                                  .filter((product) => product.isUsed)
                                  .map((product, idx) => (
                                    <li key={idx} className="text-sm flex items-center">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                                      {product.name}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {routine.notes && (
                            <div>
                              <h4 className="text-sm font-medium">Notes:</h4>
                              <p className="text-sm text-muted-foreground mt-1">{routine.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No routine entries found</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

