import { MenuService } from "@/modules/menu/menu.service";
import { asyncHandler } from "@/common/async-handler";
import { MenuItemService } from "@/modules/menu/menu-item/menu-item.service";
import { listMenuQuerySchema } from "@/modules/menu/menu.schema";
import {
  getMenuItemParamsSchema,
  updateMenuItemParamsSchema,
  updateMenuItemSchema,
} from "./menu-item/menu-item.schema";
import { ValidationError } from "@/lib/errors";

export const MenuController = {
  listMenu: asyncHandler(async (req, res) => {
    const parsed = listMenuQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError("Invalid query parameters");
    }

    const menus = await MenuService.listActive(parsed.data);

    res.status(200).json({ success: true, ...menus });
  }),
  getMenuItem: asyncHandler(async (req, res) => {
    const parsed = getMenuItemParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Invalid params");
    }

    const menuItem = await MenuItemService.findById(parsed.data.id);
    res.status(200).json({ success: true, data: menuItem });
  }),
  updateMenuItem: asyncHandler(async (req, res) => {
    const parsedParams = updateMenuItemParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new ValidationError("Invalid params");
    }

    const parsed = updateMenuItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid update menu item body");
    }

    const menuItem = await MenuItemService.update(
      parsedParams.data.id,
      parsed.data,
    );
    res.status(200).json({ success: true, data: menuItem });
  }),
};
