import { menuItemRepository } from "../menu/menu-item/menu-item.repository";
import { OrderRepository } from "./order.repository";
import {
  CreateOrderBody,
  OrderStatus,
  UpdateOrderStatusBody,
} from "./order.schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

export const OrderService = {
  findById: async (id: string) => {
    const order = await OrderRepository.findFirst({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  },
  validateOrderItemsAvailability: async (
    orderItems: CreateOrderBody["orderItems"],
  ) => {
    const menuItemIds = orderItems.map((item) => item.menuItemId);

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

    const dbMenuItemIdMapAvailability = new Map(
      menuItems.map((menu) => [menu.id, menu.isAvailable]),
    );

    for (const orderItem of orderItems) {
      if (!dbMenuItemIdMapAvailability.has(orderItem.menuItemId)) {
        throw new NotFoundError(`Menu item not found`);
      }
      if (!dbMenuItemIdMapAvailability.get(orderItem.menuItemId)) {
        throw new ValidationError(`Menu item is not available`);
      }
    }
  },
  create: async (input: CreateOrderBody) => {
    // here we always get the latest menu price from DB.
    // there is a risk where the customer might be paying different amount than they see from the UI.
    // but this can be resolved by adding a checkout page to show the latest response.
    const menuItemIds = input.orderItems.map((item) => item.menuItemId);

    const [menuItems] = await menuItemRepository.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuItemPriceMap = new Map(
      menuItems.map((item) => [item.id, item.price]),
    );

    const orderItemsData = input.orderItems.map((item) => ({
      ...item,
      priceAtOrderTime: menuItemPriceMap.get(item.menuItemId) ?? 0,
    }));

    const totalPrice = orderItemsData.reduce(
      (sum, item) => sum + item.priceAtOrderTime * item.quantity,
      0,
    );

    const order = await OrderRepository.create({
      data: {
        status: "received",
        totalPrice,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: true,
      },
    });

    return order;
  },
  validateOrderStatus: (
    currentStatus: UpdateOrderStatusBody["status"],
    newStatus: UpdateOrderStatusBody["status"],
  ) => {
    const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
      received: "preparing",
      preparing: "ready",
      ready: "completed",
      completed: null,
    };

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowedNext) {
      throw new ConflictError("Order is already completed");
    }
    if (allowedNext !== newStatus) {
      throw new ConflictError(
        `Cannot transition order from '${currentStatus}' to '${newStatus}'`,
      );
    }
  },
  update: async (id: string, input: UpdateOrderStatusBody) => {
    const order = await OrderRepository.findFirst({
      where: { id },
    });

    if (!order) throw new NotFoundError("Order not found");

    // here we validate if order status can be moving forward ornot
    OrderService.validateOrderStatus(order.status as OrderStatus, input.status);

    const updated = await OrderRepository.update({
      where: { id },
      data: input,
    });

    return updated;
  },
};
