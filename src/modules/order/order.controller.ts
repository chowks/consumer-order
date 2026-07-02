import { asyncHandler } from "@/common/async-handler";
import {
  createOrderBodySchema,
  getOrderParamsSchema,
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema,
} from "./order.schema";
import { OrderService } from "./order.service";
import { ValidationError } from "@/lib/errors";
import { publishToQueue, QUEUES } from "@/lib/queue";

export const OrderController = {
  getOrder: asyncHandler(async (req, res) => {
    const parsed = getOrderParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid params");
    }

    const order = await OrderService.findById(parsed.data.id);
    res.status(200).json({ success: true, data: order });
  }),
  createOrder: asyncHandler(async (req, res) => {
    const parsed = createOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid body");
    }

    // here we validate if each of the order item exists and available from menu item
    await OrderService.validateOrderItemsAvailability(parsed.data.orderItems);

    const order = await OrderService.create(parsed.data);

    // here is the async process after creating an order
    await publishToQueue(QUEUES.ORDER_CREATED, order);

    res.status(201).json({ success: true, data: order });
  }),
  updateOrderStatus: asyncHandler(async (req, res) => {
    const parsedParams = updateOrderStatusParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new ValidationError("Invalid params");
    }

    const parsed = updateOrderStatusBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid update order status body");
    }

    const order = await OrderService.update(parsedParams.data.id, parsed.data);
    res.status(200).json({ success: true, data: order });
  }),
};
