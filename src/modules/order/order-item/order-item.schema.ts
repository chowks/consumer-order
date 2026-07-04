import { z } from "zod";

export const createOrderItemBodySchema = z.object({
  quantity: z.number().default(1),
  remark: z.string().optional(),
  menuItemId: z.uuid(),
});
export type CreateOrderItemBody = z.infer<typeof createOrderItemBodySchema>;
