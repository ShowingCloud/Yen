import { NextRequest, NextResponse } from 'next/server';

// Configuration interface allows Host to inject secrets
export type CommerceConfig = {
  webhookSecret?: string;
  // Add commerce-specific config as needed
};

// Route Factory Pattern for Commerce
// Example: Webhooks (as shown in architecture docs)
export function createCommerceHandler(config: CommerceConfig = {}) {
  return {
    POST: async (req: NextRequest) => {
      // Webhook handler implementation
      // This will be called when the host mounts it at app/api/commerce/webhooks/route.ts
      return NextResponse.json({ message: 'Commerce webhook handler - to be implemented' });
    },
    GET: async (req: NextRequest) => {
      return NextResponse.json({ status: 'active', service: 'commerce' });
    },
  };
}

