import { APIRequestContext, APIResponse } from '@playwright/test';

export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async post(endpoint: string, payload: unknown): Promise<APIResponse> {
    return this.request.post(endpoint, {
      data: payload,
      headers: this.authHeaders(),
    });
  }

  async get(endpoint: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.request.get(endpoint, {
      params,
      headers: this.authHeaders(),
    });
  }

  async parseJson<T>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }

  private authHeaders(): Record<string, string> {
    const token = process.env.API_TOKEN || 'sandbox_test_token';
    return {
      Authorization: `Bearer ${token}`,
      'X-Merchant-Id': process.env.MERCHANT_ID || 'merchant_test_001',
    };
  }
}
