# Commerce

**Standalone Product 3** - Products, Orders, Customers, and Cart

## Overview

The Commerce package is a strictly headless e-commerce engine providing product management, order processing, customer management, and cart functionality. It is pure logic and data with no UI dependencies.

## Responsibilities

- Product Management
- Order Processing
- Customer Management
- Cart Functionality

## Independence

This package is strictly headless - pure logic and data with no UI dependencies. It can be used in any context that needs e-commerce functionality.

## Data

Owns `ShopSchema` - manages its own Prisma schema and database client.

## Installation

```bash
pnpm install @repo/commerce
```

## Usage

```typescript
import { getProduct, createOrder } from '@repo/commerce';

// In your server actions or API routes
const product = await getProduct(productId);
const order = await createOrder(orderData);
```

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

## License

MIT License - see [LICENSE](./LICENSE) file for details.

