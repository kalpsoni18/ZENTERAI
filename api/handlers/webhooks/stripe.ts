import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { db, Org } from '../../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing signature' }),
      };
    }

    // Verify webhook signature
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      signature,
      WEBHOOK_SECRET
    );

    // Handle event
    switch (stripeEvent.type) {
      case 'invoice.paid':
        await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const org = await findOrgByStripeCustomer(customerId);
  if (!org) return;

  // Update org billing status
  await db.updateOrg(org.id, {
    billing: {
      ...org.billing,
      status: 'active',
    },
  });

  // Audit log
  await db.createAuditLog({
    orgId: org.id,
    userId: 'system',
    action: 'billing.invoice.paid',
    resourceType: 'invoice',
    resourceId: invoice.id,
    metadata: { invoiceId: invoice.id, amount: invoice.amount_paid },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const org = await findOrgByStripeCustomer(customerId);
  if (!org) return;

  // Update org billing status
  await db.updateOrg(org.id, {
    billing: {
      ...org.billing,
      status: 'past_due',
    },
  });

  // Audit log
  await db.createAuditLog({
    orgId: org.id,
    userId: 'system',
    action: 'billing.invoice.payment_failed',
    resourceType: 'invoice',
    resourceId: invoice.id,
    metadata: { invoiceId: invoice.id },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const org = await findOrgByStripeCustomer(customerId);
  if (!org) return;

  // Update subscription details
  await db.updateOrg(org.id, {
    billing: {
      ...org.billing,
      subscriptionId: subscription.id,
      status: subscription.status === 'active' ? 'active' : 'canceled',
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const org = await findOrgByStripeCustomer(customerId);
  if (!org) return;

  // Update org billing status
  await db.updateOrg(org.id, {
    billing: {
      ...org.billing,
      status: 'canceled',
    },
  });
}

async function findOrgByStripeCustomer(customerId: string): Promise<Org | null> {
  // Query DynamoDB for org with matching Stripe customer ID
  // This is a simplified version - you'd need to add a GSI
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  const { Items } = await db.docClient.send(new ScanCommand({
    TableName: `${process.env.DYNAMODB_TABLE_PREFIX}-orgs`,
    FilterExpression: 'billing.stripeCustomerId = :customerId',
    ExpressionAttributeValues: {
      ':customerId': customerId,
    },
    Limit: 1,
  }));

  return Items?.[0] as Org | null;
}

