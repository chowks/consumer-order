import { getChannel } from "./rabbitmq";
import { logger } from "./logger";

export const QUEUES = {
  ORDER_CREATED: "order.created",
} as const;

export const publishToQueue = async <T>(queue: string, payload: T) => {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: true });

  const message = Buffer.from(JSON.stringify(payload));
  channel.sendToQueue(queue, message, { persistent: true });

  logger.info({ queue }, "Message published to queue");
};

export const consumeQueue = async <T>(
  queue: string,
  handler: (payload: T) => Promise<void>,
) => {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: true });
  await channel.prefetch(1);

  logger.info({ queue }, "Waiting for messages");

  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString()) as T;
      await handler(payload);
      channel.ack(msg);
      logger.info({ queue }, "Message processed and acknowledged");
    } catch (err) {
      logger.error({ err, queue }, "Failed to process message, nacking");
      channel.nack(msg, false, false);
    }
  });
};
