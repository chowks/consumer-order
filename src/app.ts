import express from "express";
import menuRoutes from "@/modules/menu/menu.routes";
import { errorMiddleware } from "@/middleware/error.middleware";
import orderRoutes from "./modules/order/order.routes";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/menus", menuRoutes);
app.use("/orders", orderRoutes);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Consumer Order listening on port ${port}`);
});
