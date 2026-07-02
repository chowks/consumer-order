import { prisma } from "@/lib/prisma";
import { Prisma } from "@generated/prisma/client";

export const menuItemRepository = {
  findFirst: async (input: Prisma.MenuItemFindFirstArgs) =>
    prisma.menuItem.findFirst(input),
  findMany: async <T extends Prisma.MenuItemFindManyArgs>(
    args: T,
  ): Promise<[Prisma.MenuItemGetPayload<T>[], number]> => {
    const [data, total] = await prisma.$transaction([
      prisma.menuItem.findMany(args),
      prisma.menuItem.count({ where: args.where }),
    ]);

    return [(data ?? []) as Prisma.MenuItemGetPayload<T>[], total ?? 0];
  },
  update: async (input: Prisma.MenuItemUpdateArgs) =>
    prisma.menuItem.update(input),
};
