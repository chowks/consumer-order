import { prisma } from "@/lib/prisma";
import { Prisma } from "@generated/prisma/client";

export const menuRepository = {
  findMany: async <T extends Prisma.MenuFindManyArgs>(
    args: T,
  ): Promise<[Prisma.MenuGetPayload<T>[], number]> => {
    const [data, total] = await prisma.$transaction([
      prisma.menu.findMany(args),
      prisma.menu.count({ where: args.where }),
    ]);

    return [(data ?? []) as Prisma.MenuGetPayload<T>[], total ?? 0];
  },
  findFirst: async (input: Prisma.MenuFindFirstArgs) =>
    prisma.menu.findFirst(input),
};
