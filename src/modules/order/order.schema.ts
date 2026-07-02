import { z } from "zod";
import { createOrderItemBodySchema } from "@/modules/order/order-item/order-item.schema";

export const createOrderBodySchema = z.object({
  orderItems: z
    .array(createOrderItemBodySchema)
    .min(1, "Order must have at least one item"),
});
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const getOrderParamsSchema = z.object({
  id: z.uuid(),
});
export type GetOrderParams = z.infer<typeof getOrderParamsSchema>;

// update
const orderStatuses = ["received", "preparing", "ready", "completed"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(orderStatuses),
});
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;

export const updateOrderStatusParamsSchema = z.object({
  id: z.uuid(),
});
export type UpdateOrderStatusParams = z.infer<
  typeof updateOrderStatusParamsSchema
>;
