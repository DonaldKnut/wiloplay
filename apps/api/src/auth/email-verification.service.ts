import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { renderFile } from "ejs";
import nodemailer, { type Transporter } from "nodemailer";
import { join } from "node:path";

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
    return this.sendTemplatedMail({
      ...input,
      subject: "Verify your Wiloplay email",
      template: "email-verification.ejs",
      textLines: [
        `Your Wiloplay email verification code is ${input.code}.`,
        "It expires in 10 minutes and can only be used once.",
      ],
      failureMessage: "Unable to send the verification email. Please try again later.",
      logLabel: "Email verification delivery failed",
    });
  }

  async sendPasswordResetCode(input: { email: string; name: string; code: string }) {
    return this.sendTemplatedMail({
      ...input,
      subject: "Reset your Wiloplay password",
      template: "password-reset.ejs",
      textLines: [
        `Your Wiloplay password reset code is ${input.code}.`,
        "It expires in 10 minutes and can only be used once.",
      ],
      failureMessage: "Unable to send the password reset email. Please try again later.",
      logLabel: "Password reset delivery failed",
    });
  }

  private async sendTemplatedMail(input: {
    email: string;
    name: string;
    code: string;
    subject: string;
    template: string;
    textLines: string[];
    failureMessage: string;
    logLabel: string;
  }) {
    const from = process.env.SMTP_FROM;
    if (!this.transporter || !from) {
      throw new ServiceUnavailableException("Email delivery is not configured. Please contact support.");
    }

    try {
      const webOrigin = process.env.WEB_ORIGIN?.replace(/\/+$/, "");
      const html = await renderFile(
        join(__dirname, "templates", input.template),
        { name: input.name, code: input.code, webOrigin },
      );
      await this.transporter.sendMail({
        from,
        to: input.email,
        subject: input.subject,
        text: [
          `Hi ${input.name},`,
          "",
          ...input.textLines,
          webOrigin ? `Return to Wiloplay: ${webOrigin}` : "",
          "",
          "If you did not request this, you can ignore this email.",
        ].filter(Boolean).join("\n"),
        html,
      });
    } catch (error) {
      this.logger.error(
        input.logLabel,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(input.failureMessage);
    }
  }
}
