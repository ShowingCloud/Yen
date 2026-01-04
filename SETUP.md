# Setup Guide

This guide explains how to set up Algedi Commerce Core in different environments.

## Standalone Setup

This is the default setup when cloning this repository directly.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apps/commerce-core
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Ensure PostgreSQL is running
   pnpm migrate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

## Monorepo Setup (Git Submodule)

When this repository is used as a git submodule in a Turborepo monorepo:

1. **Add as submodule** (from monorepo root)
   ```bash
   git submodule add <repository-url> apps/commerce-core
   ```

2. **Install dependencies** (from monorepo root)
   ```bash
   pnpm install
   ```

3. **Run with Turbo**
   ```bash
   pnpm dev --filter @algedi/commerce-core
   ```

## Dependencies

### Required

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 15.0
- Redis

## Database Setup

1. **Create database**
   ```sql
   CREATE DATABASE algedi_commerce;
   ```

2. **Run migrations**
   ```bash
   pnpm migrate
   ```

3. **Seed database (optional)**
   ```bash
   pnpm seed
   ```

## Troubleshooting

### Database Connection Errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists and user has permissions

### Redis Connection Errors

- Ensure Redis is running
- Check `REDIS_URL` in `.env`
- Test connection: `redis-cli ping`

### Migration Errors

- Ensure database is empty or use `--force` flag
- Check for conflicting migrations
- Review migration files for errors


