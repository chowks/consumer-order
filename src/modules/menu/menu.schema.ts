import { z } from "zod";

export const listMenuQuerySchema = z.object({
  name: z.string().optional(),
  limit: z.coerce.number().default(10),
  page: z.coerce.number().default(1),
});
export type ListMenuQueryParams = z.infer<typeof listMenuQuerySchema>;
