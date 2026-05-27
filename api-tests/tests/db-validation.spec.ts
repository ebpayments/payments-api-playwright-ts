import { test, expect } from '@playwright/test';
import { ChargeBuilder } from '../builders/charge.builder';
import { PaymentIntentBuilder } from '../builders/payment-intent.builder';
import { ChargeReader } from '../readers/charge.reader';
import { PaymentIntentReader } from '../readers/payment-intent.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
import { ReporterHelper } from '../../utils/reporter.helper';
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

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });

    await ReporterHelper.logApiCall(
      'Create Charge for DB Validation',
      { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();
    const reader = new ChargeReader(body);

    sync.syncCharge(body);

    // Assert — API
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertChargeSucceeded(reader);

    // Assert — DB
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

    await ReporterHelper.logDbValidation(
      'Charge Persisted to DB',
      { id: reader.getId(), amount: 2000, status: 'succeeded', paid: 1 },
      { id: dbRecord!.id, amount: dbRecord!.amount, status: dbRecord!.status, paid: dbRecord!.paid }
    );
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

    await ReporterHelper.logApiCall(
      'Declined Charge for DB Validation',
      { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();

    sync.syncCharge(
      body.error?.charge
        ? await (await request.get(`${BASE_URL}/charges/${body.error.charge}`, {
            headers: { Authorization: `Bearer ${SECRET_KEY}` },
          })).json()
        : body
    );

    // Assert — API
    await PaymentAssertions.assertDeclined(response);

    // Assert — DB
    const failedCharges = sync.getDb().getFailedCharges();
    expect(failedCharges.length).toBeGreaterThan(0);
    const record = failedCharges[0];
    expect(record.status).toBe('failed');
    expect(record.paid).toBe(0);
    expect(record.failure_code).toBe('card_declined');

    await ReporterHelper.logDbValidation(
      'Failed Charge in DB',
      { status: 'failed', paid: 0, failure_code: 'card_declined' },
      { status: record.status, paid: record.paid, failure_code: record.failure_code }
    );
  });

  test('should query charges by card brand from DB', async ({ request }) => {
    // Arrange & Act
    const visaForm = new ChargeBuilder().withAmount(1000).withDescription('Visa DB').build();
    const mcForm = new ChargeBuilder().asMastercard().withAmount(2000).withDescription('MC DB').build();

    const visaRes = await request.post(`${BASE_URL}/charges`, { headers, form: visaForm });
    const mcRes = await request.post(`${BASE_URL}/charges`, { headers, form: mcForm });

    const visaBody = await visaRes.json();
    const mcBody = await mcRes.json();

    await ReporterHelper.logApiCall('Visa Charge', { url: `${BASE_URL}/charges`, method: 'POST', headers, body: visaForm }, visaRes);
    await ReporterHelper.logApiCall('Mastercard Charge', { url: `${BASE_URL}/charges`, method: 'POST', headers, body: mcForm }, mcRes);

    sync.syncCharge(visaBody);
    sync.syncCharge(mcBody);

    // Assert — DB queries
    const visaCharges = sync.getDb().getChargesByCardBrand('visa');
    const mcCharges = sync.getDb().getChargesByCardBrand('mastercard');

    expect(visaCharges.length).toBe(1);
    expect(mcCharges.length).toBe(1);
    expect(visaCharges[0].card_last4).toBe('4242');
    expect(mcCharges[0].card_last4).toBe('4444');

    await ReporterHelper.logDbValidation(
      'Query by Card Brand',
      { visaCount: 1, mcCount: 1 },
      { visaCount: visaCharges.length, mcCount: mcCharges.length }
    );
  });

  test('should calculate total amount by status from DB', async ({ request }) => {
    // Arrange & Act
    const form1 = new ChargeBuilder().withAmount(1000).build();
    const form2 = new ChargeBuilder().withAmount(2000).build();

    const res1 = await request.post(`${BASE_URL}/charges`, { headers, form: form1 });
    const res2 = await request.post(`${BASE_URL}/charges`, { headers, form: form2 });

    const body1 = await res1.json();
    const body2 = await res2.json();

    await ReporterHelper.logApiCall('Charge 1', { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form1 }, res1);
    await ReporterHelper.logApiCall('Charge 2', { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form2 }, res2);

    sync.syncCharge(body1);
    sync.syncCharge(body2);

    // Assert — DB
    const record1 = sync.getDb().getChargeById(body1.id);
    const record2 = sync.getDb().getChargeById(body2.id);

    expect(record1).toBeDefined();
    expect(record1!.amount).toBe(1000);
    expect(record2).toBeDefined();
    expect(record2!.amount).toBe(2000);

    const total = sync.getDb().getTotalAmountByStatus('succeeded');
    expect(total).toBeGreaterThanOrEqual(3000);

    await ReporterHelper.logDbValidation(
      'Total Amount Aggregation',
      { minTotal: 3000 },
      { actualTotal: total }
    );
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

    await ReporterHelper.logApiCall(
      'Create Payment Intent for DB',
      { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();
    const reader = new PaymentIntentReader(body);

    sync.syncPaymentIntent(body);

    // Assert — API
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertPaymentIntentCreated(reader);

    // Assert — DB
    const dbRecord = sync.getDb().getPaymentIntentById(reader.getId());
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.id).toBe(reader.getId());
    expect(dbRecord!.amount).toBe(5000);
    expect(dbRecord!.currency).toBe('usd');
    expect(dbRecord!.status).toBe('requires_payment_method');
    expect(dbRecord!.livemode).toBe(0);

    await ReporterHelper.logDbValidation(
      'Payment Intent in DB',
      { id: reader.getId(), amount: 5000, status: 'requires_payment_method' },
      { id: dbRecord!.id, amount: dbRecord!.amount, status: dbRecord!.status }
    );
  });

  test('should persist confirmed payment intent to DB', async ({ request }) => {
    // Arrange
    const form = new PaymentIntentBuilder().asConfirmedVisa().withAmount(3000).build();

    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });

    await ReporterHelper.logApiCall(
      'Confirmed Payment Intent for DB',
      { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();
    const reader = new PaymentIntentReader(body);

    sync.syncPaymentIntent(body);

    // Assert — API
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertPaymentIntentSucceeded(reader);

    // Assert — DB
    const dbRecord = sync.getDb().getPaymentIntentById(reader.getId());
    expect(dbRecord).toBeDefined();
    expect(dbRecord!.status).toBe('succeeded');
    expect(dbRecord!.amount_received).toBe(3000);
    expect(dbRecord!.latest_charge).toMatch(/^ch_/);

    await ReporterHelper.logDbValidation(
      'Confirmed Payment Intent in DB',
      { status: 'succeeded', amountReceived: 3000 },
      { status: dbRecord!.status, amountReceived: dbRecord!.amount_received }
    );
  });

  test('should query succeeded payment intents from DB', async ({ request }) => {
    // Arrange & Act
    const form1 = new PaymentIntentBuilder().asConfirmedVisa().withAmount(1000).build();
    const form2 = new PaymentIntentBuilder().asConfirmedMastercard().withAmount(2000).build();

    const res1 = await request.post(`${BASE_URL}/payment_intents`, { headers, form: form1 });
    const res2 = await request.post(`${BASE_URL}/payment_intents`, { headers, form: form2 });

    const body1 = await res1.json();
    const body2 = await res2.json();

    await ReporterHelper.logApiCall('PI Visa', { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form1 }, res1);
    await ReporterHelper.logApiCall('PI Mastercard', { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form2 }, res2);

    sync.syncPaymentIntent(body1);
    sync.syncPaymentIntent(body2);

    // Assert — DB
    const record1 = sync.getDb().getPaymentIntentById(body1.id);
    const record2 = sync.getDb().getPaymentIntentById(body2.id);

    expect(record1).toBeDefined();
    expect(record1!.status).toBe('succeeded');
    expect(record1!.amount_received).toBe(1000);
    expect(record2).toBeDefined();
    expect(record2!.status).toBe('succeeded');
    expect(record2!.amount_received).toBe(2000);

    const succeeded = sync.getDb().getSucceededPaymentIntents();
    expect(succeeded.length).toBeGreaterThanOrEqual(2);

    await ReporterHelper.logDbValidation(
      'Succeeded Payment Intents Query',
      { minCount: 2, pi1Amount: 1000, pi2Amount: 2000 },
      { count: succeeded.length, pi1Amount: record1!.amount_received, pi2Amount: record2!.amount_received }
    );
  });

});