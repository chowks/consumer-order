import { logger } from "@/lib/logger";
import { menuItemRepository } from "@/modules/menu/menu-item/menu-item.repository";
import type { Order, OrderItem } from "@generated/prisma/client";

type OrderCreatedMessage = Order & { orderItems: OrderItem[] };

export const orderCreatedWorker = async (payload: OrderCreatedMessage) => {
  const menuItemIds = payload.orderItems.map((item) => item.menuItemId);

  const [menuItems] = await menuItemRepository.findMany({
    where: {
      id: { in: menuItemIds },
    },
  });

  const menuItemMapName = new Map(
    menuItems.map((item) => [item.id, item.name]),
  );

  const items = payload.orderItems.map((item) => ({
    quantity: item.quantity,
    remark: item.remark ?? undefined,
    name: menuItemMapName.get(item.menuItemId),
  }));

  logger.info(
    {
      orderNumber: payload.orderNumber,
      itemCount: items.length,
      items,
      createdAt: payload.createdAt,
    },
    "[Kitchen Display] New order received",
  );
};
