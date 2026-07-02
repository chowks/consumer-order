import "dotenv/config";
import { consumeQueue, QUEUES } from "@/lib/queue";
import { disconnectRabbitMQ } from "@/lib/rabbitmq";
import { logger } from "@/lib/logger";
import { orderCreatedWorker } from "./order-created.worker";

const shutdown = async () => {
  logger.info("Shutting down worker...");
  await disconnectRabbitMQ();
  process.exit(0);
};

const main = async () => {
  logger.info("Starting order worker...");
  await consumeQueue(QUEUES.ORDER_CREATED, orderCreatedWorker);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

main().catch((err) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
