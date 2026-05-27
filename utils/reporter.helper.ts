import { test, APIResponse } from '@playwright/test';

export interface RequestLog {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: Record<string, string>;
}

export class ReporterHelper {

  // ─── API Call Logger ─────────────────────────────────────────

  static async logApiCall(
    label: string,
    requestLog: RequestLog,
    response: APIResponse
  ): Promise<void> {
    const responseBody = await response.json().catch(() => ({}));
    const responseHeaders = response.headers();

    await test.step(`🌐 ${label} — ${requestLog.method} ${requestLog.url}`, async () => {

      // Request details
      await test.info().attach('📤 Request', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({
          url: requestLog.url,
          method: requestLog.method,
          headers: requestLog.headers,
          body: requestLog.body ?? null,
        }, null, 2)),
      });

      // Response details
      await test.info().attach('📥 Response', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({
          status: response.status(),
          statusText: response.statusText(),
          headers: responseHeaders,
          body: responseBody,
        }, null, 2)),
      });
    });
  }

  // ─── DB Validation Logger ─────────────────────────────────────

  static async logDbValidation(
    label: string,
    expected: Record<string, unknown>,
    actual: Record<string, unknown>
  ): Promise<void> {
    await test.step(`🗄️ DB Validation — ${label}`, async () => {
      await test.info().attach('🗄️ DB Record', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({
          expected,
          actual,
          match: JSON.stringify(expected) === JSON.stringify(
            Object.fromEntries(
              Object.keys(expected).map(k => [k, actual[k]])
            )
          ),
        }, null, 2)),
      });
    });
  }

  // ─── Assertion Logger ─────────────────────────────────────────

  static async logAssertion(label: string, details: Record<string, unknown>): Promise<void> {
    await test.step(`✅ Assertion — ${label}`, async () => {
      await test.info().attach('✅ Assertion Details', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(details, null, 2)),
      });
    });
  }

  // ─── Test Metadata ────────────────────────────────────────────

  static addTestMetadata(metadata: Record<string, string>): void {
    Object.entries(metadata).forEach(([key, value]) => {
      test.info().annotations.push({ type: key, description: value });
    });
  }
}