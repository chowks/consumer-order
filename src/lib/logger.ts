import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    project: "consumer-order",
    // module: process.env.AWS_LAMBDA_FUNCTION_NAME,
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});
