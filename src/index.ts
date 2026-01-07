// Main entry point - exports all public APIs
// Note: Commerce is headless (no components), only services and actions

// Export database client
export { prisma } from './db';

// Export services
export * from './services/product-service';
export * from './services';

// Export server actions (for direct import)
export * from './server/actions';

// Export utilities
export * from './lib';
