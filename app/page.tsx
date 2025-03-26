import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, BarChart3Icon, BookmarkIcon, PlusIcon, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <header className="mb-12 flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <div>
            <div className="flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-primary" aria-hidden="true" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">SkinTracker</h1>
            </div>
            <p className="mt-1 text-muted-foreground">Track your skincare journey with ease</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/routines" className="block group">
            <Card className="h-full overflow-hidden border-muted/40 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-full mr-3 group-hover:bg-primary/20 transition-colors">
                    <PlusIcon className="h-5 w-5" />
                  </span>
                  Daily Routines
                </CardTitle>
                <CardDescription>Log your morning and evening skincare routines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/50 group-hover:border-primary/20 transition-colors">
                  <Button variant="ghost" size="sm" className="gap-1 font-medium">
                    <PlusIcon className="h-4 w-4" />
                    <span>Log today's routine</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/products" className="block group">
            <Card className="h-full overflow-hidden border-muted/40 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-full mr-3 group-hover:bg-primary/20 transition-colors">
                    <BookmarkIcon className="h-5 w-5" />
                  </span>
                  Products
                </CardTitle>
                <CardDescription>Manage your skincare products and notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/50 group-hover:border-primary/20 transition-colors">
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground">Track your favorites</p>
                    <p className="text-xs text-muted-foreground/70">Keep notes on what works</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tracking" className="block group">
            <Card className="h-full overflow-hidden border-muted/40 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-full mr-3 group-hover:bg-primary/20 transition-colors">
                    <CalendarIcon className="h-5 w-5" />
                  </span>
                  Skin Condition
                </CardTitle>
                <CardDescription>Track your skin condition and concerns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/50 group-hover:border-primary/20 transition-colors">
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground">Monitor changes</p>
                    <p className="text-xs text-muted-foreground/70">Record daily observations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress" className="block group">
            <Card className="h-full overflow-hidden border-muted/40 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-full mr-3 group-hover:bg-primary/20 transition-colors">
                    <BarChart3Icon className="h-5 w-5" />
                  </span>
                  Progress Summary
                </CardTitle>
                <CardDescription>View your weekly skincare progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/50 group-hover:border-primary/20 transition-colors">
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground">See your journey</p>
                    <p className="text-xs text-muted-foreground/70">Track improvements over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

