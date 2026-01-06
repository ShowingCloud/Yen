import { z } from 'zod';

// Zod schemas for Commerce operations

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  externalId: z.string().optional(),
  extendedAttributes: z.record(z.unknown()).optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  externalId: z.string().nullable(),
  extendedAttributes: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

// Variant schemas
export const VariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  organizationId: z.string(),
  sku: z.string().nullable(),
  name: z.string().nullable(),
  price: z.number().nullable(),
  inventory: z.number().nullable(),
  attributes: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Variant = z.infer<typeof VariantSchema>;

// Order schemas
export const OrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string().nullable(),
  status: z.string(),
  total: z.number(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;
