import 'server-only';
import Stripe from 'stripe';
import { prisma } from '../db';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Billing Service
 * Handles Stripe Connect integration, subscriptions, and usage-based billing
 */

/**
 * Create or retrieve Stripe Connect account for a tenant
 * @param organizationId - Organization/tenant ID
 * @param email - Email for the Stripe account
 * @returns Stripe account ID
 */
export async function createOrGetStripeAccount(
  organizationId: string,
  email?: string
): Promise<string> {
  // Check if tenant already has a Stripe account
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId },
    select: { id: true, stripeAccountId: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${organizationId}`);
  }

  if (tenant.stripeAccountId) {
    return tenant.stripeAccountId;
  }

  // Create Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'express', // Use Express accounts for simpler onboarding
    email: email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      organizationId,
    },
  });

  // Update tenant with Stripe account ID
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}

/**
 * Create Stripe Customer for a tenant
 * @param organizationId - Organization/tenant ID
 * @param email - Customer email
 * @returns Stripe customer ID
 */
export async function createOrGetStripeCustomer(
  organizationId: string,
  email?: string
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId },
    select: { id: true, stripeCustomerId: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${organizationId}`);
  }

  if (tenant.stripeCustomerId) {
    return tenant.stripeCustomerId;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      organizationId,
    },
  });

  // Update tenant with Stripe customer ID
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a subscription for a tenant
 * @param organizationId - Organization/tenant ID
 * @param priceId - Stripe Price ID for the subscription
 * @returns Stripe subscription ID
 */
export async function createSubscription(
  organizationId: string,
  priceId: string
): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId },
    select: { id: true, stripeCustomerId: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${organizationId}`);
  }

  if (!tenant.stripeCustomerId) {
    // Create customer if it doesn't exist
    await createOrGetStripeCustomer(organizationId);
    const updatedTenant = await prisma.tenant.findUnique({
      where: { organizationId },
      select: { stripeCustomerId: true },
    });
    if (!updatedTenant?.stripeCustomerId) {
      throw new Error('Failed to create Stripe customer');
    }
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: tenant.stripeCustomerId!,
    items: [{ price: priceId }],
    metadata: {
      organizationId,
    },
  });

  // Create billing cycle
  await prisma.billingCycle.create({
    data: {
      organizationId,
      tenantId: tenant.id,
      stripeSubscriptionId: subscription.id,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      status: 'active',
      metadata: {
        priceId,
        subscriptionStatus: subscription.status,
      },
    },
  });

  // Update tenant
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeSubscriptionId: subscription.id,
      billingStatus: subscription.status,
    },
  });

  return subscription.id;
}

/**
 * Record usage for metered billing
 * @param organizationId - Organization/tenant ID
 * @param eventType - Type of usage event (e.g., "ai_generation", "image_description")
 * @param quantity - Number of units consumed
 * @param metadata - Additional metadata about the usage
 * @returns Usage record ID and Stripe usage record ID
 */
export async function recordUsage(
  organizationId: string,
  eventType: string,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<{ id: string; stripeUsageRecordId?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      billingCycles: {
        where: { status: 'active' },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${organizationId}`);
  }

  // Get active billing cycle
  const activeCycle = tenant.billingCycles[0];
  if (!activeCycle) {
    // Create a shadow ledger entry even without active subscription
    const usageRecord = await prisma.usageRecord.create({
      data: {
        organizationId,
        tenantId: tenant.id,
        eventType,
        quantity,
        metadata: {
          ...metadata,
          recordedWithoutSubscription: true,
        },
        recordedAt: new Date(),
      },
    });

    return { id: usageRecord.id };
  }

  // Calculate pricing (simplified - in production, use pricing tiers)
  const unitPrice = getUnitPrice(eventType);
  const totalAmount = unitPrice * quantity;

  // Create usage record in database (shadow ledger)
  const usageRecord = await prisma.usageRecord.create({
    data: {
      organizationId,
      tenantId: tenant.id,
      billingCycleId: activeCycle.id,
      eventType,
      quantity,
      unitPrice,
      totalAmount,
      metadata,
      recordedAt: new Date(),
    },
  });

  // Update billing cycle total
  await prisma.billingCycle.update({
    where: { id: activeCycle.id },
    data: {
      totalUsage: {
        increment: quantity,
      },
      totalAmount: {
        increment: totalAmount,
      },
    },
  });

  // Report to Stripe if subscription exists
  let stripeUsageRecordId: string | undefined;
  if (tenant.stripeSubscriptionId) {
    try {
      // Get subscription item ID (simplified - assumes single item)
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
      const subscriptionItemId = subscription.items.data[0]?.id;

      if (subscriptionItemId) {
        const stripeUsageRecord = await stripe.subscriptionItems.createUsageRecord(
          subscriptionItemId,
          {
            quantity,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'increment',
          }
        );

        stripeUsageRecordId = stripeUsageRecord.id;

        // Update usage record with Stripe ID
        await prisma.usageRecord.update({
          where: { id: usageRecord.id },
          data: { stripeUsageRecordId },
        });
      }
    } catch (error) {
      console.error('Error reporting usage to Stripe:', error);
      // Continue even if Stripe reporting fails - shadow ledger is the source of truth
    }
  }

  return {
    id: usageRecord.id,
    stripeUsageRecordId,
  };
}

/**
 * Get unit price for an event type
 * Simplified pricing - in production, use pricing tiers or configuration
 */
function getUnitPrice(eventType: string): number {
  const pricing: Record<string, number> = {
    ai_generation: 0.01, // $0.01 per generation
    image_description: 0.005, // $0.005 per image
    embedding: 0.001, // $0.001 per embedding
  };

  return pricing[eventType] || 0.01; // Default price
}

/**
 * Get billing summary for a tenant
 * @param organizationId - Organization/tenant ID
 * @returns Billing summary with current cycle and usage
 */
export async function getBillingSummary(organizationId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId },
    select: {
      id: true,
      creditsBalance: true,
      billingStatus: true,
      stripeSubscriptionId: true,
      billingCycles: {
        where: { status: 'active' },
        orderBy: { startDate: 'desc' },
        take: 1,
        include: {
          usageRecords: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${organizationId}`);
  }

  const activeCycle = tenant.billingCycles[0];

  return {
    organizationId,
    creditsBalance: tenant.creditsBalance,
    billingStatus: tenant.billingStatus,
    subscriptionId: tenant.stripeSubscriptionId,
    currentCycle: activeCycle
      ? {
          id: activeCycle.id,
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
          totalUsage: activeCycle.totalUsage,
          totalAmount: activeCycle.totalAmount,
          recentUsage: activeCycle.usageRecords,
        }
      : null,
  };
}

/**
 * Handle Stripe webhook events
 * @param event - Stripe webhook event
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;

      if (!organizationId) {
        console.warn('Subscription event missing organizationId');
        return;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { organizationId },
        select: { id: true },
      });

      if (!tenant) {
        console.warn(`Tenant not found for organizationId: ${organizationId}`);
        return;
      }

      if (event.type === 'customer.subscription.deleted') {
        // Subscription canceled
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            billingStatus: 'canceled',
            stripeSubscriptionId: null,
          },
        });

        // Close active billing cycles
        await prisma.billingCycle.updateMany({
          where: {
            tenantId: tenant.id,
            status: 'active',
          },
          data: {
            status: 'completed',
            endDate: new Date(),
          },
        });
      } else {
        // Subscription updated
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            billingStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
          },
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (!subscriptionId) {
        return;
      }

      // Find billing cycle and mark as paid
      await prisma.billingCycle.updateMany({
        where: {
          stripeSubscriptionId: subscriptionId,
          status: 'active',
        },
        data: {
          metadata: {
            lastInvoiceId: invoice.id,
            lastInvoiceAmount: invoice.amount_paid,
            lastInvoiceDate: new Date().toISOString(),
          },
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (!subscriptionId) {
        return;
      }

      // Update tenant billing status
      const billingCycle = await prisma.billingCycle.findFirst({
        where: {
          stripeSubscriptionId: subscriptionId,
          status: 'active',
        },
        select: { tenantId: true },
      });

      if (billingCycle) {
        await prisma.tenant.update({
          where: { id: billingCycle.tenantId },
          data: {
            billingStatus: 'past_due',
          },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe webhook event: ${event.type}`);
  }
}

