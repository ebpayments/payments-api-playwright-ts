import { DbHelper } from './db.helper';

export class StripeSync {
  private db: DbHelper;

  constructor() {
    this.db = new DbHelper();
  }

  syncCharge(body: Record<string, any>): void {
    this.db.insertCharge({
      id: body.id,
      amount: body.amount,
      currency: body.currency,
      status: body.status,
      paid: body.paid ? 1 : 0,
      captured: body.captured ? 1 : 0,
      card_brand: body.payment_method_details?.card?.brand ?? null,
      card_last4: body.payment_method_details?.card?.last4 ?? null,
      description: body.description ?? null,
      failure_code: body.failure_code ?? null,
      decline_code: body.outcome?.reason ?? null,
      risk_level: body.outcome?.risk_level ?? 'unknown',
      risk_score: body.outcome?.risk_score ?? 0,
      livemode: body.livemode ? 1 : 0,
      created_at: body.created,
    });
  }

  syncPaymentIntent(body: Record<string, any>): void {
    this.db.insertPaymentIntent({
      id: body.id,
      amount: body.amount,
      amount_received: body.amount_received ?? 0,
      currency: body.currency,
      status: body.status,
      payment_method: body.payment_method ?? null,
      latest_charge: body.latest_charge ?? null,
      livemode: body.livemode ? 1 : 0,
      created_at: body.created,
    });
  }

  getDb(): DbHelper {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}