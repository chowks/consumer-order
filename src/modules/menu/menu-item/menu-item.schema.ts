import { z } from "zod";

export const updateMenuItemSchema = z
  .object({
    isAvailable: z.boolean().optional(),
    description: z.string().optional(),
    name: z.string().optional(),
    categoryId: z.string().optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
  })
  .strict();

export type UpdateMenuItemSchema = z.infer<typeof updateMenuItemSchema>;

export const updateMenuItemParamsSchema = z.object({
  id: z.uuid(),
});
export type UpdateMenuItemParams = z.infer<typeof updateMenuItemParamsSchema>;

// get
export const getMenuItemParamsSchema = z.object({
  id: z.uuid(),
});
export type GetMenuItemParams = z.infer<typeof getMenuItemParamsSchema>;
