# Contributing to Algedi Commerce Core

Thank you for your interest in contributing to Algedi Commerce Core!

## Development Setup

### Standalone Development

This repository can be developed independently:

```bash
git clone <repository-url>
cd apps/commerce-core
pnpm install
pnpm migrate
pnpm dev
```

### Monorepo Development

When used as a git submodule in a Turborepo monorepo:

1. The root `package.json` may override dependencies using workspace protocol
2. Use `pnpm install` from the monorepo root
3. Run commands with Turbo: `pnpm dev --filter @algedi/commerce-core`

## Security Requirements

⚠️ **CRITICAL**: All database queries MUST include `tenant_id` filtering. This is non-negotiable for data isolation.

## Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Always include `tenant_id` in queries
- Run `pnpm lint` before committing
- Run `pnpm type-check` to ensure type safety

## Database Migrations

When creating migrations:

1. Use TypeORM migration commands
2. Ensure RLS policies are included
3. Test migrations on a copy of production data
4. Document any breaking changes

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all queries are tenant-scoped
5. Run migrations and tests
6. Submit a pull request with a clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

