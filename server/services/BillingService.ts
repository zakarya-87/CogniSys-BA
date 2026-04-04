import Stripe from 'stripe';
import { getAdminDb } from '../lib/firebaseAdmin';
import { UsageMeteringService, AIPlan } from './UsageMeteringService';
import { logger } from '../logger';

export interface OrgBilling {
  orgId: string;
  stripeCustomerId: string;
  subscriptionId?: string;
  plan: AIPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  currentPeriodEnd?: string;
  updatedAt: string;
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    logger.warn('STRIPE_SECRET_KEY not set — billing disabled');
    return null;
  }
  return new Stripe(key, { apiVersion: '2025-01-27.acacia' });
}

const PLAN_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

export class BillingService {
  private static col() {
    return getAdminDb().collection('billing');
  }

  /** Get or create a Stripe customer for an org. */
  static async ensureCustomer(orgId: string, email: string, orgName: string): Promise<string | null> {
    const stripe = getStripe();
    if (!stripe) return null;

    const snap = await BillingService.col().doc(orgId).get();
    if (snap.exists) {
      const data = snap.data() as OrgBilling;
      if (data.stripeCustomerId) return data.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email,
      name: orgName,
      metadata: { orgId },
    });

    await BillingService.col().doc(orgId).set(
      { orgId, stripeCustomerId: customer.id, plan: 'free', status: 'none', updatedAt: new Date().toISOString() },
      { merge: true },
    );

    return customer.id;
  }

  /** Create a Stripe Checkout session to upgrade to a paid plan. */
  static async createCheckoutSession(
    orgId: string,
    plan: 'pro' | 'enterprise',
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string } | null> {
    const stripe = getStripe();
    if (!stripe) return null;

    const snap = await BillingService.col().doc(orgId).get();
    const billing = snap.exists ? (snap.data() as OrgBilling) : null;
    if (!billing?.stripeCustomerId) throw Object.assign(new Error('No Stripe customer for this org'), { statusCode: 400 });

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) throw Object.assign(new Error(`No price configured for plan: ${plan}`), { statusCode: 400 });

    const session = await stripe.checkout.sessions.create({
      customer: billing.stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId, plan },
      subscription_data: { metadata: { orgId, plan } },
    });

    return { url: session.url! };
  }

  /** Create a Stripe Customer Portal session for managing subscriptions. */
  static async createPortalSession(orgId: string, returnUrl: string): Promise<{ url: string } | null> {
    const stripe = getStripe();
    if (!stripe) return null;

    const snap = await BillingService.col().doc(orgId).get();
    const billing = snap.exists ? (snap.data() as OrgBilling) : null;
    if (!billing?.stripeCustomerId) throw Object.assign(new Error('No Stripe customer for this org'), { statusCode: 400 });

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /** Get current billing info for an org. */
  static async getBilling(orgId: string): Promise<OrgBilling | null> {
    const snap = await BillingService.col().doc(orgId).get();
    return snap.exists ? (snap.data() as OrgBilling) : null;
  }

  /** Update plan after Stripe event — called by webhook handler. */
  static async syncPlan(orgId: string, plan: AIPlan, subscriptionId: string, status: OrgBilling['status'], currentPeriodEnd?: string): Promise<void> {
    await BillingService.col().doc(orgId).set(
      { plan, subscriptionId, status, currentPeriodEnd, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    await UsageMeteringService.setPlan(orgId, plan);
    logger.info({ orgId, plan, status }, 'Billing plan synced');
  }

  /** Verify and parse a Stripe webhook event. */
  static constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return null;
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      return null;
    }
  }
}
