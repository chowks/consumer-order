import { Router } from "express";
import { OrderController } from "./order.controller";

const orderRoutes: Router = Router();

orderRoutes.post("/", OrderController.createOrder);
orderRoutes.get("/:id", OrderController.getOrder);
orderRoutes.patch("/:id/status", OrderController.updateOrderStatus);

export default orderRoutes;
