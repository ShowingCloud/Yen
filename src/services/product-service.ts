import { Prisma } from '../generated/client';
import { prisma } from '../db';
import type { CreateProductDto } from '../lib/types';

/**
 * ProductService - Handles all product-related operations
 * All queries strictly filter by tenantId (organizationId) for multi-tenant isolation
 */
export class ProductService {
  /**
   * Get all products for a specific tenant
   * @param tenantId - The organization/tenant ID
   * @returns Array of products
   */
  static async getProducts(tenantId: string) {
    return prisma.product.findMany({
      where: {
        organizationId: tenantId,
      },
      include: {
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single product by ID (with tenant isolation)
   * @param id - Product ID
   * @param tenantId - The organization/tenant ID (required for security)
   * @returns Product or null if not found
   */
  static async getProductById(id: string, tenantId: string) {
    return prisma.product.findFirst({
      where: {
        id,
        organizationId: tenantId, // Strict tenant filtering
      },
      include: {
        variants: true,
      },
    });
  }

  /**
   * Create a new product for a tenant
   * @param tenantId - The organization/tenant ID
   * @param data - Product data
   * @returns Created product
   */
  static async createProduct(tenantId: string, data: CreateProductDto) {
    return prisma.product.create({
      data: {
        organizationId: tenantId, // Always set tenantId
        name: data.name,
        description: data.description ?? null,
        price: data.price ? new Prisma.Decimal(data.price) : null,
        externalId: data.externalId ?? null,
        extendedAttributes: data.extendedAttributes ?? null,
      },
      include: {
        variants: true,
      },
    });
  }
}

