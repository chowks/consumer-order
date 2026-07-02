import { UpdateMenuItemSchema } from "@/modules/menu/menu-item/menu-item.schema";
import { menuItemRepository } from "@/modules/menu/menu-item/menu-item.repository";
import { NotFoundError } from "@/lib/errors";

export const MenuItemService = {
  update: async (id: string, input: UpdateMenuItemSchema) => {
    const menuItem = await menuItemRepository.findFirst({
      where: { id },
    });

    if (!menuItem) throw new NotFoundError("Menu item not found");

    const updated = await menuItemRepository.update({
      where: { id },
      data: input,
    });

    return updated;
  },
  findById: async (id: string) => {
    const menuItem = await menuItemRepository.findFirst({
      where: {
        id,
      },
    });

    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    return menuItem;
  },
};
