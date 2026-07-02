import { Router } from "express";
import { MenuController } from "@/modules/menu/menu.controller";

const menuRoutes: Router = Router();

menuRoutes.get("/", MenuController.listMenu);
menuRoutes.get("/items/:id", MenuController.getMenuItem);
menuRoutes.patch("/items/:id", MenuController.updateMenuItem);

export default menuRoutes;
