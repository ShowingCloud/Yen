import { prisma } from '../db';

/**
 * Check if a tenant has sufficient credits
 * @param tenantId - The organization/tenant ID
 * @param requiredCredits - Number of credits required (default: 1)
 * @returns true if tenant has sufficient credits, false otherwise
 * @throws Error if tenant not found
 */
export async function checkCredits(
  tenantId: string,
  requiredCredits: number = 1
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId: tenantId },
    select: { creditsBalance: true },
  });

  if (!tenant) {
    // If tenant doesn't exist, create one with default credits (for development)
    // In production, tenants should be created through proper onboarding
    await prisma.tenant.create({
      data: {
        organizationId: tenantId,
        creditsBalance: 0, // Start with 0 credits - must be purchased
      },
    });
    return false;
  }

  return tenant.creditsBalance >= requiredCredits;
}

/**
 * Deduct credits from a tenant's balance
 * Also records usage for billing
 * @param tenantId - The organization/tenant ID
 * @param amount - Number of credits to deduct
 * @param eventType - Type of usage event (default: "ai_generation")
 * @returns Updated credits balance
 * @throws Error if tenant not found or insufficient credits
 */
export async function deductCredits(
  tenantId: string,
  amount: number = 1,
  eventType: string = 'ai_generation'
): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId: tenantId },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  if (tenant.creditsBalance < amount) {
    throw new Error(`Insufficient credits. Required: ${amount}, Available: ${tenant.creditsBalance}`);
  }

  const updated = await prisma.tenant.update({
    where: { organizationId: tenantId },
    data: {
      creditsBalance: {
        decrement: amount,
      },
    },
    select: { creditsBalance: true },
  });

  // Record usage for billing (async, don't block)
  recordUsage(tenantId, eventType, amount).catch((error) => {
    console.error('Error recording usage:', error);
    // Don't fail the credit deduction if usage recording fails
  });

  return updated.creditsBalance;
}

/**
 * Add credits to a tenant's balance
 * @param tenantId - The organization/tenant ID
 * @param amount - Number of credits to add
 * @returns Updated credits balance
 * @throws Error if tenant not found
 */
export async function addCredits(
  tenantId: string,
  amount: number
): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId: tenantId },
  });

  if (!tenant) {
    // Create tenant if it doesn't exist
    const created = await prisma.tenant.create({
      data: {
        organizationId: tenantId,
        creditsBalance: amount,
      },
      select: { creditsBalance: true },
    });
    return created.creditsBalance;
  }

  const updated = await prisma.tenant.update({
    where: { organizationId: tenantId },
    data: {
      creditsBalance: {
        increment: amount,
      },
    },
    select: { creditsBalance: true },
  });

  return updated.creditsBalance;
}

/**
 * Get current credits balance for a tenant
 * @param tenantId - The organization/tenant ID
 * @returns Current credits balance
 */
export async function getCreditsBalance(tenantId: string): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { organizationId: tenantId },
    select: { creditsBalance: true },
  });

  if (!tenant) {
    return 0;
  }

  return tenant.creditsBalance;
}

