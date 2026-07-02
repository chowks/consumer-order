import { ListResponse } from "@/types/list";
import { menuRepository } from "@/modules/menu/menu.repository";
import { ListMenuQueryParams } from "@/modules/menu/menu.schema";

export const MenuService = {
  listActive: async (req: ListMenuQueryParams) => {
    const { limit, page, name, ...filter } = req;

    const skip = (page - 1) * limit;

    const [menus, total] = await menuRepository.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      where: {
        ...filter,
        ...(name && {
          name: {
            contains: name,
            mode: "insensitive",
          },
        }),
        isActive: true,
      },
      include: {
        menuItems: {
          where: {
            isAvailable: true, // here we show available menu item since it is a consumer ordering
          },
        },
      },
    });

    return {
      data: menus,
      meta: {
        filter,
        total: total,
        page,
        limit,
      },
    } satisfies ListResponse<typeof menus, typeof filter>;
  },
};
