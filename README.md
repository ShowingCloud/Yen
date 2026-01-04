# Algedi Commerce Core

A headless commerce API built with MedusaJS. This is the Single Source of Truth for Products, Orders, and Customers in the Algedi Multi-Tenant E-Commerce Platform.

## Features

- **MedusaJS** headless commerce engine
- **PostgreSQL** database with Row Level Security (RLS)
- **TypeORM** for database management
- **Multi-tenant** architecture with `tenant_id` scoping
- **Zod** for input validation
- **TypeScript** for type safety

## Security

⚠️ **CRITICAL**: ALL database queries MUST be scoped by `tenant_id` via Row Level Security (RLS). This ensures complete data isolation between tenants.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (or npm/yarn)
- PostgreSQL >= 15.0
- Redis (for caching and job queues)

## Installation

### Standalone Installation

```bash
# Clone the repository
git clone <repository-url>
cd apps/commerce-core

# Install dependencies
pnpm install

# Set up environment variables (see Environment Variables section)
# Run database migrations
pnpm migrate

# Seed database (optional)
pnpm seed

# Start development server
pnpm dev
```

### As Part of Monorepo (Git Submodule)

If using as a git submodule in a Turborepo monorepo:

```bash
# From monorepo root
pnpm install
pnpm dev --filter @algedi/commerce-core
```

**Note**: This repository is designed to work independently. When used in a monorepo, ensure the root `package.json` properly configures workspace dependencies.

## Environment Variables

Create a `.env` file in the root of this app:

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/algedi_commerce
DATABASE_TYPE=postgres

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=9000
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=your-jwt-secret-key-here

# Cookie Secret
COOKIE_SECRET=your-cookie-secret-key-here

# Stripe (for payments)
STRIPE_API_KEY=sk_test_your_key_here
```

## Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run database migrations
pnpm migrate

# Seed database with sample data
pnpm seed

# Type check
pnpm type-check
```

The API will be available at `http://localhost:9000`.

## Database Schema

This service owns the **Commerce Schema** which includes:

### Tenant
- `id`: UUID
- `stripe_connect_id`: For revenue sharing
- `subscription_tier`: free, pro, enterprise

### Product
- `id`: UUID
- `tenant_id`: UUID (RLS Key)
- `attributes`: JSONB (flexible product data)
- `inventory_count`: Int

### Customer
- `id`: UUID
- `email`: String
- `global_consent`: Boolean (cross-tenant sharing opt-in)

### TenantCustomer
- `tenant_id`: UUID
- `customer_id`: UUID
- `marketing_opt_in`: Boolean

## Row Level Security (RLS)

All queries must include `tenant_id` filtering. Example:

```typescript
// ✅ CORRECT
const products = await productRepository.find({
  where: { tenant_id: currentTenantId }
});

// ❌ WRONG - Missing tenant_id filter
const products = await productRepository.find();
```

## API Endpoints

MedusaJS provides a comprehensive REST API. Key endpoints:

- `GET /store/products` - List products (tenant-scoped)
- `GET /store/products/:id` - Get product details
- `POST /store/carts` - Create shopping cart
- `POST /store/carts/:id/line-items` - Add items to cart
- `POST /store/carts/:id/payment-sessions` - Initialize payment
- `POST /store/orders` - Create order

See [MedusaJS Documentation](https://docs.medusajs.com) for complete API reference.

## Project Structure

```
apps/commerce-core/
├── src/
│   ├── models/          # TypeORM entities
│   ├── repositories/    # Custom repositories
│   ├── services/         # Business logic
│   ├── api/              # API routes
│   └── index.ts          # Entry point
├── migrations/           # Database migrations
├── medusa-config.js      # Medusa configuration
└── package.json
```

## Multi-Tenancy

This service implements multi-tenancy through:

1. **Row Level Security (RLS)**: Database-level tenant isolation
2. **Middleware**: Automatic `tenant_id` injection from request headers
3. **Repository Pattern**: All queries automatically filtered by tenant

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all queries are tenant-scoped
5. Submit a pull request

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Support

For issues and questions, please open an issue on the repository.

## Related Projects

- [Algedi CMS](../cms) - Frontend CMS application
- [Algedi AI Service](../ai-service) - AI operations service
