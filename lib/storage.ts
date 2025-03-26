// Simple localStorage wrapper with fallbacks for SSR
export const storage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window === "undefined") return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return defaultValue

      // Parse the JSON and handle Date objects
      const parsed = JSON.parse(item, (key, value) => {
        if (value && typeof value === "object" && value.__type === "Date") {
          return new Date(value.value)
        }
        return value
      })

      return parsed
    } catch (error) {
      console.error("Error getting item from localStorage:", error)
      return defaultValue
    }
  },

  setItem: (key: string, value: any): void => {
    if (typeof window === "undefined") return

    try {
      // Handle Date objects by converting them to a special format
      const serialized = JSON.stringify(value, (key, value) => {
        if (value instanceof Date) {
          return { __type: "Date", value: value.toISOString() }
        }
        return value
      })

      window.localStorage.setItem(key, serialized)

      // Dispatch a custom event to notify components in the same window
      const event = new Event("skintracker-storage-update")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error setting item in localStorage:", error)
    }
  },
}

