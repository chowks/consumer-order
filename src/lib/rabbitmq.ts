import "dotenv/config";
import amqplib, { type ChannelModel, type Channel } from "amqplib";
import { logger } from "./logger";

let channelModel: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async () => {
  if (channelModel) return channelModel;

  channelModel = await amqplib.connect(process.env.RABBITMQ_URL!);

  channelModel.on("error", (err) => {
    logger.error({ err }, "RabbitMQ connection error");
    channelModel = null;
    channel = null;
  });

  channelModel.on("close", () => {
    logger.warn("RabbitMQ connection closed");
    channelModel = null;
    channel = null;
  });

  logger.info("Connected to RabbitMQ");
  return channelModel;
};

export const getChannel = async () => {
  if (channel) return channel;

  const conn = await connectRabbitMQ();
  channel = await conn.createChannel();

  channel.on("error", (err) => {
    logger.error({ err }, "RabbitMQ channel error");
    channel = null;
  });

  channel.on("close", () => {
    logger.warn("RabbitMQ channel closed");
    channel = null;
  });

  return channel;
};

export const disconnectRabbitMQ = async () => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (channelModel) {
    await channelModel.close();
    channelModel = null;
  }
  logger.info("Disconnected from RabbitMQ");
};
