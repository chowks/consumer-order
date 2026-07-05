import { asyncHandler } from "@/common/async-handler";
import {
  createOrderBodySchema,
  getOrderParamsSchema,
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema,
} from "./order.schema";
import { OrderService } from "./order.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { publishToQueue, QUEUES } from "@/lib/queue";
import { menuItemRepository } from "../menu/menu-item/menu-item.repository";

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

    const menuItemIds = parsed.data.orderItems?.map((item) => item.menuItemId);

    const [menuItems, count] = await menuItemRepository.findMany({
      where: {
        id: {
          in: menuItemIds,
        },
      },
    });

    if (count <= 0) {
      throw new NotFoundError("No available menu item found");
    }

    // here we validate if each of the order item exists and available from menu item
    await OrderService.validateOrderItemsAvailability(
      menuItems,
      parsed.data.orderItems,
    );

    const order = await OrderService.create(menuItems, parsed.data);

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
