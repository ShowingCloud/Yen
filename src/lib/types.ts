import { z } from 'zod';

// Zod schemas for Commerce operations

// Example: Product schema
export const ProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  externalId: z.string().optional(),
  extendedAttributes: z.record(z.unknown()).optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// Example: Order schema
export const OrderSchema = z.object({
  customerId: z.string().optional(),
  status: z.string().default('pending'),
  total: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type Order = z.infer<typeof OrderSchema>;

// Add more schemas as needed

