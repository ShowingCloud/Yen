# Commerce (Yen)

**Standalone Product 3** - Products, Orders, Customers, and Cart

## Overview

The Commerce package is a strictly headless Full-Stack Package (FSP) providing e-commerce functionality. It is pure logic and data with no UI dependencies, making it suitable for any context that needs e-commerce capabilities.

## Responsibilities

- Product Management
- Order Processing
- Customer Management
- Cart Functionality

## Architecture

This package follows the **Full-Stack Package (FSP)** pattern:

- **Services** - Business logic (ProductService, OrderService, etc.)
- **Server Actions** - Next.js Server Actions (`'use server'`)
- **Route Handlers** - API route factories (primarily for webhooks)
- **Data Schema** - Own Prisma schema with distinct table names

## Independence

This package is strictly headless - pure logic and data with no UI dependencies. It can be used in any context that needs e-commerce functionality.

## Data

Owns `ShopSchema` - manages its own Prisma schema and database client.

**Tables:**
- `commerce_products` - Product catalog
- `commerce_orders` - Order records
- `commerce_order_items` - Order line items

## Installation

```bash
pnpm install @repo/commerce
```

## Usage

### Importing Services

```typescript
import { ProductService } from '@repo/commerce/services';

const product = await ProductService.getById(productId);
```

### Importing Server Actions

```typescript
import { getProduct, createOrder } from '@repo/commerce/actions';

// In a Server Component or Server Action
const product = await getProduct(productId);
const order = await createOrder(orderData);
```

### Mounting Route Handlers (Host App)

```typescript
// apps/platform/app/api/commerce/webhooks/route.ts
import { createCommerceHandler } from '@repo/commerce/api';

const handler = createCommerceHandler({
  webhookSecret: process.env.WEBHOOK_SECRET,
});

export const POST = handler.POST;
export const GET = handler.GET;
```

## Package Exports

This package uses subpath exports for better tree-shaking:

- `@repo/commerce` - Main entry (services, actions, lib)
- `@repo/commerce/api` - Route handler factories (webhooks)
- `@repo/commerce/actions` - Server Actions
- `@repo/commerce/services` - Business logic services
- `@repo/commerce/types` - TypeScript types and Zod schemas

## Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Build
pnpm build

# Run migrations
pnpm prisma:migrate
```

## Dependencies

- **next** - Server Actions and Route Handlers (peer dependency)
- **prisma** - Database ORM
- **zod** - Schema validation
- **server-only** - Prevents server code from leaking to client

**Note:** This package has no React dependencies as it is headless.

## License

MIT License - see [LICENSE](./LICENSE) file for details.


