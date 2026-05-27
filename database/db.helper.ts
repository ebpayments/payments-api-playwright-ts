import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, 'stripe.db');

export interface ChargeRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid: number;
  captured: number;
  card_brand: string;
  card_last4: string;
  description: string | null;
  failure_code: string | null;
  decline_code: string | null;
  risk_level: string;
  risk_score: number;
  livemode: number;
  created_at: number;
  synced_at: number;
}

export interface PaymentIntentRecord {
  id: string;
  amount: number;
  amount_received: number;
  currency: string;
  status: string;
  payment_method: string | null;
  latest_charge: string | null;
  livemode: number;
  created_at: number;
  synced_at: number;
}

export class DbHelper {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS charges (
        id TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        paid INTEGER NOT NULL DEFAULT 0,
        captured INTEGER NOT NULL DEFAULT 0,
        card_brand TEXT,
        card_last4 TEXT,
        description TEXT,
        failure_code TEXT,
        decline_code TEXT,
        risk_level TEXT,
        risk_score INTEGER,
        livemode INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        synced_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_intents (
        id TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        amount_received INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT,
        latest_charge TEXT,
        livemode INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        synced_at INTEGER NOT NULL
      );
    `);
  }

  // ─── Charge Operations ───────────────────────────────────────

  insertCharge(charge: Omit<ChargeRecord, 'synced_at'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO charges 
      (id, amount, currency, status, paid, captured, card_brand, card_last4, 
       description, failure_code, decline_code, risk_level, risk_score, livemode, created_at, synced_at)
      VALUES 
      (@id, @amount, @currency, @status, @paid, @captured, @card_brand, @card_last4,
       @description, @failure_code, @decline_code, @risk_level, @risk_score, @livemode, @created_at, @synced_at)
    `);
    stmt.run({ ...charge, synced_at: Date.now() });
  }

  getChargeById(id: string): ChargeRecord | undefined {
    return this.db.prepare('SELECT * FROM charges WHERE id = ?').get(id) as ChargeRecord | undefined;
  }

  getChargesByStatus(status: string): ChargeRecord[] {
    return this.db.prepare('SELECT * FROM charges WHERE status = ?').all(status) as ChargeRecord[];
  }

  getChargesByCardBrand(brand: string): ChargeRecord[] {
    return this.db.prepare('SELECT * FROM charges WHERE card_brand = ?').all(brand) as ChargeRecord[];
  }

  getFailedCharges(): ChargeRecord[] {
    return this.db.prepare('SELECT * FROM charges WHERE status = ?').all('failed') as ChargeRecord[];
  }

  getTotalAmountByStatus(status: string): number {
    const result = this.db.prepare(
      'SELECT SUM(amount) as total FROM charges WHERE status = ?'
    ).get(status) as { total: number | null };
    return result.total ?? 0;
  }

  // ─── Payment Intent Operations ───────────────────────────────

  insertPaymentIntent(intent: Omit<PaymentIntentRecord, 'synced_at'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO payment_intents
      (id, amount, amount_received, currency, status, payment_method, latest_charge, livemode, created_at, synced_at)
      VALUES
      (@id, @amount, @amount_received, @currency, @status, @payment_method, @latest_charge, @livemode, @created_at, @synced_at)
    `);
    stmt.run({ ...intent, synced_at: Date.now() });
  }

  getPaymentIntentById(id: string): PaymentIntentRecord | undefined {
    return this.db.prepare('SELECT * FROM payment_intents WHERE id = ?').get(id) as PaymentIntentRecord | undefined;
  }

  getPaymentIntentsByStatus(status: string): PaymentIntentRecord[] {
    return this.db.prepare('SELECT * FROM payment_intents WHERE status = ?').all(status) as PaymentIntentRecord[];
  }

  getSucceededPaymentIntents(): PaymentIntentRecord[] {
    return this.db.prepare('SELECT * FROM payment_intents WHERE status = ?').all('succeeded') as PaymentIntentRecord[];
  }

  // ─── Utility ─────────────────────────────────────────────────

  clearAll(): void {
    this.db.exec('DELETE FROM charges; DELETE FROM payment_intents;');
  }

  close(): void {
    this.db.close();
  }
}