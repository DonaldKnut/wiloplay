import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    this.transporter = host && Number.isInteger(port)
      ? nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
        })
      : null;
  }

  async sendCode(input: { email: string; name: string; code: string }) {
    const from = process.env.SMTP_FROM;
    if (!this.transporter || !from) {
      throw new ServiceUnavailableException("Email delivery is not configured. Please contact support.");
    }

    try {
      await this.transporter.sendMail({
        from,
        to: input.email,
        subject: "Verify your Wiloplay email",
        text: `Hi ${input.name}, your Wiloplay email verification code is ${input.code}. It expires in 10 minutes.`,
        html: `
          <main style="color:#142016;font-family:Arial,sans-serif;line-height:1.6;max-width:560px;margin:auto">
            <h1>Verify your email.</h1>
            <p>Hi ${escapeHtml(input.name)},</p>
            <p>Enter this code in Wiloplay to verify your email address:</p>
            <p style="background:#eff7ed;border-radius:12px;color:#23421f;font-size:30px;font-weight:bold;letter-spacing:8px;padding:18px;text-align:center">${input.code}</p>
            <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
          </main>
        `,
      });
    } catch (error) {
      this.logger.error(
        "Email verification delivery failed",
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException("Unable to send the verification email. Please try again later.");
    }
  }
}
