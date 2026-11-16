import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackCustomer = {
  customer_code: string;
};

type PaystackDedicatedAccount = {
  account_name: string;
  account_number: string;
  bank: { name: string };
};

type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer: { customer_code: string } | string;
};

@Injectable()
export class PaystackService {
  private get secretKey() {
    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      throw new ServiceUnavailableException(
        "Paystack is not configured. Set PAYSTACK_SECRET_KEY on the API.",
      );
    }
    return secret;
  }

  private async request<T>(path: string, method: "GET" | "POST", body?: unknown) {
    let response: Response;
    try {
      response = await fetch(`https://api.paystack.co${path}`, {
        method,
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new BadGatewayException("Paystack could not be reached. Please try again.");
    }

    let result: PaystackEnvelope<T>;
    try {
      result = await response.json() as PaystackEnvelope<T>;
    } catch {
      throw new BadGatewayException("Paystack returned an invalid response.");
    }
    if (!response.ok || !result.status) {
      throw new BadGatewayException(
        `Paystack request failed: ${result.message || response.statusText}`,
      );
    }
    return result.data;
  }

  assertWebhookSignature(rawBody: Buffer | undefined, signature: string | string[] | undefined) {
    if (!rawBody || typeof signature !== "string" || !/^[a-f\d]{128}$/i.test(signature)) {
      throw new UnauthorizedException("Invalid Paystack webhook signature.");
    }
    const expected = createHmac("sha512", this.secretKey).update(rawBody).digest();
    const actual = Buffer.from(signature, "hex");
    if (!timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException("Invalid Paystack webhook signature.");
    }
  }

  async createCustomer(input: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }) {
    const [firstName, ...lastName] = input.name.trim().split(/\s+/);
    return this.request<PaystackCustomer>("/customer", "POST", {
      email: input.email,
      first_name: firstName,
      last_name: lastName.join(" ") || firstName,
      ...(input.metadata && { metadata: input.metadata }),
    });
  }

  createDedicatedAccount(customerCode: string) {
    return this.request<PaystackDedicatedAccount>("/dedicated_account", "POST", {
      customer: customerCode,
      preferred_bank: "wema-bank",
    });
  }

  verifyTransaction(reference: string) {
    return this.request<PaystackTransaction>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      "GET",
    );
  }
}
