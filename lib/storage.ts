// Simple localStorage wrapper with fallbacks for SSR
export const storage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window === "undefined") return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error("Error getting item from localStorage:", error)
      return defaultValue
    }
  },

  setItem: (key: string, value: any): void => {
    if (typeof window === "undefined") return

    try {
      window.localStorage.setItem(key, JSON.stringify(value))

      // Dispatch a custom event to notify components in the same window
      const event = new Event("skintracker-storage-update")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error setting item in localStorage:", error)
    }
  },
}

