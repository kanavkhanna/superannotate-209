import * as z from "zod"

// Routine form schema
export const routineFormSchema = z.object({
  products: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      isUsed: z.boolean(),
    }),
  ),
  notes: z.string().optional(),
})

// Product form schema
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand name is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
})

// Tracking form schema
export const trackingFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  skinRating: z.string().min(1, "Please select a skin rating"),
  concerns: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
})

