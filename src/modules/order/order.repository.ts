import { prisma } from "@/lib/prisma";
import { Prisma } from "@generated/prisma/client";

export const OrderRepository = {
  findFirst: async <T extends Prisma.OrderFindFirstArgs>(
    input: T,
  ): Promise<Prisma.OrderGetPayload<T> | null> =>
    prisma.order.findFirst(input) as Promise<Prisma.OrderGetPayload<T> | null>,
  create: async <T extends Prisma.OrderCreateArgs>(
    input: T,
  ): Promise<Prisma.OrderGetPayload<T>> =>
    prisma.order.create(input) as unknown as Promise<Prisma.OrderGetPayload<T>>,
  update: async (input: Prisma.OrderUpdateArgs) => prisma.order.update(input),
  count: async () => prisma.order.count(),
};
