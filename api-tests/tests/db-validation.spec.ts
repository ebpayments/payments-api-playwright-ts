import { test, expect } from '@playwright/test';
import { ChargeBuilder } from '../builders/charge.builder';
import { PaymentIntentBuilder } from '../builders/payment-intent.builder';
import { ChargeReader } from '../readers/charge.reader';
import { PaymentIntentReader } from '../readers/payment-intent.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
import { StripeSync } from '../../database/stripe-sync';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Database Validation', () => {
  let sync: StripeSync;

  test.beforeEach(() => {
    sync = new StripeSync();
    sync.getDb().clearAll();
  });

  test.afterEach(() => {
    sync.close();
  });

  // ─── Charge DB Validation ────────────────────────────────────

  test('should persist charge data to DB correctly', async ({ request }) => {
    // Arrange
    const form = new ChargeBuilder()
      .withAmount(2000)
      .withCurrency('usd')
      .withDescription('DB validation test')
      .build();

    // Act — create charge via API
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });
    const body = await response.json();
    const reader = new ChargeReader(body);

    // Sync to DB
    sync.syncCharge(body);

    // Assert — API response
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertChargeSucceeded(reader);

    // Assert — DB validation
    const dbRecord = sync.getDb().getChargeById(reader.getId());
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.id).toBe(reader.getId());
    expect(dbRecord!.amount).toBe(2000);
    expect(dbRecord!.currency).toBe('usd');
    expect(dbRecord!.status).toBe('succeeded');
    expect(dbRecord!.paid).toBe(1);
    expect(dbRecord!.captured).toBe(1);
    expect(dbRecord!.livemode).toBe(0);
    expect(dbRecord!.card_brand).toBe(reader.getCardBrand());
    expect(dbRecord!.card_last4).toBe(reader.getCardLast4());
  });

  test('should persist failed charge to DB with decline info', async ({ request }) => {
    // Arrange
    const form = new ChargeBuilder()
      .asInsufficientFunds()
      .withAmount(2000)
      .withDescription('Declined DB test')
      .build();

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });
    const body = await response.json();

    // Sync to DB — fetch the actual charge record
    sync.syncCharge(
      body.error?.charge
        ? await (await request.get(`${BASE_URL}/charges/${body.error.charge}`, {
            headers: { Authorization: `Bearer ${SECRET_KEY}` },
          })).json()
        : body
    );

    // Assert — API declined
    await PaymentAssertions.assertDeclined(response);

    // Assert — DB has failed record
    const failedCharges = sync.getDb().getFailedCharges();
    expect(failedCharges.length).toBeGreaterThan(0);
    const record = failedCharges[0];
    expect(record.status).toBe('failed');
    expect(record.paid).toBe(0);
    expect(record.failure_code).toBe('card_declined');
  });

  test('should query charges by card brand from DB', async ({ request }) => {
    // Arrange — create Visa and Mastercard charges
    const visaForm = new ChargeBuilder().withAmount(1000).withDescription('Visa DB').build();
    const mcForm = new ChargeBuilder().asMastercard().withAmount(2000).withDescription('MC DB').build();

    // Act
    const visaRes = await request.post(`${BASE_URL}/charges`, { headers, form: visaForm });
    const mcRes = await request.post(`${BASE_URL}/charges`, { headers, form: mcForm });

    sync.syncCharge(await visaRes.json());
    sync.syncCharge(await mcRes.json());

    // Assert — DB queries
    const visaCharges = sync.getDb().getChargesByCardBrand('visa');
    const mcCharges = sync.getDb().getChargesByCardBrand('mastercard');

    expect(visaCharges.length).toBe(1);
    expect(mcCharges.length).toBe(1);
    expect(visaCharges[0].card_last4).toBe('4242');
    expect(mcCharges[0].card_last4).toBe('4444');
  });

  test('should calculate total amount by status from DB', async ({ request }) => {
    // Arrange — create 2 successful charges
    const form1 = new ChargeBuilder().withAmount(1000).build();
    const form2 = new ChargeBuilder().withAmount(2000).build();

    // Act
    const res1 = await request.post(`${BASE_URL}/charges`, { headers, form: form1 });
    const res2 = await request.post(`${BASE_URL}/charges`, { headers, form: form2 });

    const body1 = await res1.json();
    const body2 = await res2.json();

    sync.syncCharge(body1);
    sync.syncCharge(body2);

    // Assert — verify each charge individually in DB
    const record1 = sync.getDb().getChargeById(body1.id);
    const record2 = sync.getDb().getChargeById(body2.id);

    expect(record1).toBeDefined();
    expect(record1!.amount).toBe(1000);
    expect(record2).toBeDefined();
    expect(record2!.amount).toBe(2000);

    // Assert — total includes at least our 2 charges
    const total = sync.getDb().getTotalAmountByStatus('succeeded');
    expect(total).toBeGreaterThanOrEqual(3000);
  });

  // ─── Payment Intent DB Validation ────────────────────────────

  test('should persist payment intent to DB correctly', async ({ request }) => {
    // Arrange
    const form = new PaymentIntentBuilder()
      .withAmount(5000)
      .withCurrency('usd')
      .withDescription('PI DB validation test')
      .build();

    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });
    const body = await response.json();
    const reader = new PaymentIntentReader(body);

    // Sync to DB
    sync.syncPaymentIntent(body);

    // Assert — API response
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertPaymentIntentCreated(reader);

    // Assert — DB validation
    const dbRecord = sync.getDb().getPaymentIntentById(reader.getId());
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.id).toBe(reader.getId());
    expect(dbRecord!.amount).toBe(5000);
    expect(dbRecord!.currency).toBe('usd');
    expect(dbRecord!.status).toBe('requires_payment_method');
    expect(dbRecord!.livemode).toBe(0);
  });

  test('should persist confirmed payment intent to DB', async ({ request }) => {
    // Arrange
    const form = new PaymentIntentBuilder()
      .asConfirmedVisa()
      .withAmount(3000)
      .build();

    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });
    const body = await response.json();
    const reader = new PaymentIntentReader(body);

    // Sync to DB
    sync.syncPaymentIntent(body);

    // Assert — API response
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertPaymentIntentSucceeded(reader);

    // Assert — DB validation
    const dbRecord = sync.getDb().getPaymentIntentById(reader.getId());
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.status).toBe('succeeded');
    expect(dbRecord!.amount_received).toBe(3000);
    expect(dbRecord!.latest_charge).toMatch(/^ch_/);
  });

  test('should query succeeded payment intents from DB', async ({ request }) => {
    // Arrange — create 2 confirmed intents
    const form1 = new PaymentIntentBuilder().asConfirmedVisa().withAmount(1000).build();
    const form2 = new PaymentIntentBuilder().asConfirmedMastercard().withAmount(2000).build();

    // Act
    const res1 = await request.post(`${BASE_URL}/payment_intents`, { headers, form: form1 });
    const res2 = await request.post(`${BASE_URL}/payment_intents`, { headers, form: form2 });

    const body1 = await res1.json();
    const body2 = await res2.json();

    sync.syncPaymentIntent(body1);
    sync.syncPaymentIntent(body2);

    // Assert — verify each intent individually in DB
    const record1 = sync.getDb().getPaymentIntentById(body1.id);
    const record2 = sync.getDb().getPaymentIntentById(body2.id);

    expect(record1).toBeDefined();
    expect(record1!.status).toBe('succeeded');
    expect(record1!.amount_received).toBe(1000);

    expect(record2).toBeDefined();
    expect(record2!.status).toBe('succeeded');
    expect(record2!.amount_received).toBe(2000);

    // Assert — at least our 2 intents are in DB
    const succeeded = sync.getDb().getSucceededPaymentIntents();
    expect(succeeded.length).toBeGreaterThanOrEqual(2);
    succeeded.forEach(record => {
      expect(record.status).toBe('succeeded');
      expect(record.amount_received).toBeGreaterThan(0);
    });
  });

});