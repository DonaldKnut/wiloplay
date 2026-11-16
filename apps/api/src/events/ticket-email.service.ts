import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import * as QRCode from "qrcode";

type TicketEmailInput = {
  email: string;
  name: string;
  event: {
    title: string;
    artistName: string;
    venue: string;
    city: string;
    startsAt: Date;
  };
  tickets: { code: string }[];
};

export type TicketEmailResult = { sent: true } | { sent: false; error: string };

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
export class TicketEmailService {
  private readonly logger = new Logger(TicketEmailService.name);
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

  async qrDataUrl(code: string) {
    return QRCode.toDataURL(code, { errorCorrectionLevel: "M", margin: 1, width: 280 });
  }

  async sendTickets(input: TicketEmailInput): Promise<TicketEmailResult> {
    const from = process.env.SMTP_FROM;
    if (!this.transporter || !from) {
      return {
        sent: false,
        error: "SMTP is not configured; your tickets are available in My tickets.",
      };
    }

    try {
      const attachments = await Promise.all(input.tickets.map(async (ticket, index) => ({
        filename: `wiloplay-ticket-${index + 1}.png`,
        content: await QRCode.toBuffer(ticket.code, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
        }),
        contentType: "image/png",
        cid: `ticket-${index + 1}@wiloplay`,
      })));
      const ticketMarkup = input.tickets.map((ticket, index) => `
        <div style="border:1px solid #dce5dc;border-radius:12px;margin:16px 0;padding:16px">
          <strong>Ticket ${index + 1}</strong>
          <p style="font-family:monospace;letter-spacing:1px">${escapeHtml(ticket.code)}</p>
          <img src="cid:ticket-${index + 1}@wiloplay" width="180" height="180" alt="Ticket QR code">
        </div>
      `).join("");
      const date = input.event.startsAt.toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      });

      await this.transporter.sendMail({
        from,
        to: input.email,
        subject: `Your Wiloplay tickets: ${input.event.title}`,
        text: `Hi ${input.name}, your tickets for ${input.event.title} are ready. ${input.event.artistName} · ${input.event.venue}, ${input.event.city} · ${date}.`,
        html: `
          <main style="color:#142016;font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto">
            <h1>Your tickets are ready.</h1>
            <p>Hi ${escapeHtml(input.name)},</p>
            <p>Your tickets for <strong>${escapeHtml(input.event.title)}</strong> are confirmed.</p>
            <p>${escapeHtml(input.event.artistName)} · ${escapeHtml(input.event.venue)}, ${escapeHtml(input.event.city)}<br>${escapeHtml(date)}</p>
            ${ticketMarkup}
            <p>Show each QR code at the door. Each ticket can be scanned once.</p>
          </main>
        `,
        attachments,
      });
      return { sent: true };
    } catch (error) {
      this.logger.error(
        "Ticket email delivery failed",
        error instanceof Error ? error.stack : String(error),
      );
      return {
        sent: false,
        error: "Tickets were created, but the confirmation email could not be sent. Check SMTP settings.",
      };
    }
  }

  async sendEventUpdate(input: {
    attendees: { email: string; name: string }[];
    event: TicketEmailInput["event"];
    message: string;
  }) {
    const from = process.env.SMTP_FROM;
    const transporter = this.transporter;
    if (!transporter || !from) {
      throw new ServiceUnavailableException(
        "Attendee notifications are unavailable until SMTP is configured.",
      );
    }

    const date = input.event.startsAt.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const safeMessage = escapeHtml(input.message).replace(/\r?\n/g, "<br>");
    const results = await Promise.allSettled(input.attendees.map((attendee) =>
      transporter.sendMail({
        from,
        to: attendee.email,
        subject: `Update from ${input.event.artistName}: ${input.event.title}`,
        text: `Hi ${attendee.name},\n\n${input.message}\n\n${input.event.title} · ${input.event.venue}, ${input.event.city} · ${date}`,
        html: `
          <main style="color:#142016;font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto">
            <h1>Update from ${escapeHtml(input.event.artistName)}</h1>
            <p>Hi ${escapeHtml(attendee.name)},</p>
            <p>${safeMessage}</p>
            <p><strong>${escapeHtml(input.event.title)}</strong><br>
              ${escapeHtml(input.event.venue)}, ${escapeHtml(input.event.city)}<br>
              ${escapeHtml(date)}</p>
          </main>
        `,
      }),
    ));
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) {
      this.logger.error(`Event update email delivery failed for ${failed} of ${results.length} recipients.`);
    }
    return {
      recipientCount: results.length,
      sentCount: results.length - failed,
      failedCount: failed,
    };
  }
}
