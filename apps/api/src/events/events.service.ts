import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto } from "./events.dto";
import { PaystackService } from "./paystack.service";
import { TicketEmailService } from "./ticket-email.service";

const PLATFORM_FEE_PERCENT = 10;

function isDemoPaymentsEnabled() {
  return process.env.NODE_ENV !== "production"
    && process.env.PAYMENT_MODE?.trim().toLowerCase() === "demo";
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    && error.code === "P2002";
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketEmail: TicketEmailService,
    private readonly paystack: PaystackService,
  ) {}

  getPaymentMode() {
    return { mode: isDemoPaymentsEnabled() ? "demo" as const : "paystack" as const };
  }

  private async issueMissingTickets(where: Prisma.TicketOrderWhereInput) {
    const orders = await this.prisma.ticketOrder.findMany({
      where: {
        ...where,
        paymentStatus: "PAID",
        ticketsIssuedAt: null,
        paymentMethod: "PAYSTACK_BANK_TRANSFER",
        paystackTransactionReference: { not: null },
      },
      select: { id: true, quantity: true },
    });

    for (const order of orders) {
      await this.prisma.$transaction(async (transaction) => {
        const claimed = await transaction.ticketOrder.updateMany({
          where: {
            id: order.id,
            paymentStatus: "PAID",
            ticketsIssuedAt: null,
            paymentMethod: "PAYSTACK_BANK_TRANSFER",
            paystackTransactionReference: { not: null },
          },
          data: { ticketsIssuedAt: new Date() },
        });
        if (claimed.count !== 1) return;
        await transaction.ticket.createMany({
          data: Array.from({ length: order.quantity }, () => ({
            orderId: order.id,
            code: randomUUID().replace(/-/g, "").toUpperCase(),
          })),
        });
      });
    }
  }

  async list() {
    const events = await this.prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 30,
      select: {
        id: true,
        title: true,
        artistName: true,
        venue: true,
        city: true,
        startsAt: true,
        priceCents: true,
        capacity: true,
        ticketsSold: true,
        coverUrl: true,
        ticketCategories: {
          select: { id: true, name: true, priceCents: true, capacity: true, ticketsSold: true },
          orderBy: { priceCents: "asc" },
        },
      },
    });
    return events;
  }

  async search(query: string) {
    const term = query.trim().slice(0, 100);
    if (!term) return [];
    return this.prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { artistName: { contains: term, mode: "insensitive" } },
          { venue: { contains: term, mode: "insensitive" } },
          { city: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { startsAt: "asc" },
      take: 12,
      select: {
        id: true,
        title: true,
        artistName: true,
        venue: true,
        city: true,
        startsAt: true,
        priceCents: true,
        capacity: true,
        ticketsSold: true,
        coverUrl: true,
      },
    });
  }

  async create(artistId: string, input: CreateEventDto, cover?: Express.Multer.File) {
    if (new Date(input.startsAt).getTime() <= Date.now()) {
      if (cover) await unlink(cover.path);
      throw new BadRequestException("Choose a date in the future.");
    }
    let categories: { name: string; priceCents: number; capacity: number }[];
    try {
      categories = input.ticketCategories
        ? JSON.parse(input.ticketCategories) as typeof categories
        : [{ name: "Regular", priceCents: input.priceCents, capacity: input.capacity }];
    } catch {
      if (cover) await unlink(cover.path);
      throw new BadRequestException("Ticket categories must be valid JSON.");
    }
    const categoryNames = new Set<string>();
    if (!Array.isArray(categories) || categories.length < 1 || categories.length > 10
      || categories.some((category) => {
        const name = typeof category?.name === "string" ? category.name.trim() : "";
        const valid = name.length >= 2 && name.length <= 40
          && Number.isInteger(category.priceCents) && category.priceCents >= 0
          && category.priceCents <= 100000000
          && Number.isInteger(category.capacity) && category.capacity >= 1
          && category.capacity <= 100000 && !categoryNames.has(name.toLowerCase());
        categoryNames.add(name.toLowerCase());
        return !valid;
      })
      || categories.reduce((total, category) => total + category.capacity, 0) > 100000) {
      if (cover) await unlink(cover.path);
      throw new BadRequestException("Add 1-10 ticket categories with unique names, valid prices, and a total capacity up to 100,000.");
    }
    const capacity = categories.reduce((total, category) => total + category.capacity, 0);
    const priceCents = Math.min(...categories.map((category) => category.priceCents));
    try {
      return await this.prisma.event.create({
        data: {
          artistId,
          title: input.title.trim(),
          artistName: input.artistName.trim(),
          venue: input.venue.trim(),
          city: input.city.trim(),
          startsAt: new Date(input.startsAt),
          priceCents,
          capacity,
          coverUrl: cover ? `/uploads/${cover.filename}` : null,
          ticketCategories: {
            create: categories.map((category) => ({
              name: category.name.trim(),
              priceCents: category.priceCents,
              capacity: category.capacity,
            })),
          },
        },
        include: { ticketCategories: true },
      });
    } catch (error) {
      if (cover) await unlink(cover.path);
      throw error;
    }
  }

  async addCapacity(artistId: string, eventId: string, additionalTickets: number) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, artistId },
      include: { ticketCategories: { orderBy: { priceCents: "asc" }, take: 1 } },
    });
    if (!event) throw new NotFoundException("Event not found.");
    if (event.capacity + additionalTickets > 100000
      || (event.ticketCategories[0]?.capacity ?? 0) + additionalTickets > 100000) {
      throw new BadRequestException("Event capacity cannot exceed 100,000 tickets.");
    }

    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.event.updateMany({
        where: { id: eventId, artistId, capacity: event.capacity },
        data: { capacity: { increment: additionalTickets } },
      });
      if (updated.count !== 1) {
        throw new ConflictException("Event capacity changed. Refresh and try again.");
      }
      const category = event.ticketCategories[0];
      if (category) {
        await transaction.ticketCategory.update({
          where: { id: category.id },
          data: { capacity: { increment: additionalTickets } },
        });
      }
    });
    return this.prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  }

  async notifyAttendees(artistId: string, eventId: string, message: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, artistId },
      include: {
        orders: {
          where: {
            paymentStatus: "PAID",
            OR: [
              { paymentMethod: "FREE" },
              { paymentMethod: "PAYSTACK_BANK_TRANSFER", paystackTransactionReference: { not: null } },
            ],
          },
          select: { user: { select: { name: true, email: true } } },
        },
      },
    });
    if (!event) throw new NotFoundException("Event not found.");

    const attendees: { email: string; name: string }[] = [...new Map(
      event.orders.map((order) => [order.user.email, order.user] as const),
    ).values()];
    if (!attendees.length) {
      return { recipientCount: 0, sentCount: 0, failedCount: 0 };
    }

    return this.ticketEmail.sendEventUpdate({
      attendees,
      event,
      message: message.trim(),
    });
  }

  async listArtistEvents(artistId: string) {
    await this.issueMissingTickets({ event: { artistId } });
    const events = await this.prisma.event.findMany({
      where: { artistId },
      orderBy: { startsAt: "desc" },
      include: {
        ticketCategories: { orderBy: { priceCents: "asc" } },
        orders: {
          where: {
            OR: [
              { paymentMethod: "FREE" },
              { paymentMethod: "PAYSTACK_BANK_TRANSFER" },
              { paymentMethod: "DEMO" },
            ],
          },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            category: true,
            tickets: {
              select: { id: true, code: true, checkedInAt: true },
              orderBy: { issuedAt: "asc" },
            },
          },
        },
      },
    });

    return events.map((event) => ({
      ...event,
      orders: event.orders.map(({ paystackCustomerCode: _providerCustomerCode, ...order }) => order),
      paidTickets: event.orders
        .filter((order) => order.paymentStatus === "PAID" && order.paymentMethod !== "DEMO")
        .reduce((total, order) => total + order.quantity, 0),
      demoTickets: event.orders
        .filter((order) => order.paymentMethod === "DEMO")
        .reduce((total, order) => total + order.quantity, 0),
      pendingTickets: event.orders
        .filter((order) => order.paymentStatus === "PENDING")
        .reduce((total, order) => total + order.quantity, 0),
      revenueCents: event.orders
        .filter((order) => order.paymentStatus === "PAID"
          && order.paymentMethod === "PAYSTACK_BANK_TRANSFER"
          && order.paystackTransactionReference !== null)
        .reduce((total, order) => total + order.totalCents - order.platformFeeCents, 0),
      platformFeesCents: event.orders
        .filter((order) => order.paymentStatus === "PAID"
          && order.paymentMethod === "PAYSTACK_BANK_TRANSFER"
          && order.paystackTransactionReference !== null)
        .reduce((total, order) => total + order.platformFeeCents, 0),
    }));
  }

  async listMyTickets(userId: string) {
    await this.issueMissingTickets({ userId });
    const orders = await this.prisma.ticketOrder.findMany({
      where: {
        userId,
        paymentMethod: { in: ["FREE", "PAYSTACK_BANK_TRANSFER", "DEMO"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            artistName: true,
            venue: true,
            city: true,
            startsAt: true,
          },
        },
        category: true,
        tickets: {
          select: { id: true, code: true, checkedInAt: true, issuedAt: true },
          orderBy: { issuedAt: "asc" },
        },
      },
    });

    return Promise.all(orders.map(async (order) => {
      const { paystackCustomerCode: _providerCustomerCode, ...publicOrder } = order;
      return {
        ...publicOrder,
        tickets: await Promise.all(order.tickets.map(async (ticket) => ({
          ...ticket,
          qrDataUrl: await this.ticketEmail.qrDataUrl(ticket.code),
        }))),
      };
    }));
  }

  async purchase(
    userId: string,
    eventId: string,
    quantity: number,
    categoryId?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: { orderBy: { priceCents: "asc" } } },
    });
    if (!event || event.startsAt <= new Date()) {
      throw new NotFoundException("This show is no longer available.");
    }
    if (event.artistId === userId) {
      throw new BadRequestException("Artists cannot buy tickets to their own event.");
    }
    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!buyer) throw new NotFoundException("Your account could not be found.");

    const category = categoryId
      ? event.ticketCategories.find((item) => item.id === categoryId)
      : event.ticketCategories.find((item) => item.name.toLowerCase() === "regular")
        ?? event.ticketCategories[0];
    if (!category) throw new NotFoundException("This ticket category is no longer available.");
    const subtotalCents = category.priceCents * quantity;
    const platformFeeCents = Math.round((subtotalCents * PLATFORM_FEE_PERCENT) / 100);
    const totalCents = subtotalCents + platformFeeCents;
    const freeOrder = totalCents === 0;
    const demoPayment = !freeOrder && isDemoPaymentsEnabled();
    const reference = `WILO-${randomUUID().replace(/-/g, "").toUpperCase()}`;
    let order = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.event.updateMany({
        where: {
          id: eventId,
          ticketsSold: { lte: event.capacity - quantity },
        },
        data: { ticketsSold: { increment: quantity } },
      });
      if (updated.count !== 1) {
        throw new ConflictException("There aren't enough tickets left for this show.");
      }

      const categoryUpdated = await transaction.ticketCategory.updateMany({
        where: {
          id: category.id,
          ticketsSold: { lte: category.capacity - quantity },
        },
        data: { ticketsSold: { increment: quantity } },
      });
      if (categoryUpdated.count !== 1) {
        throw new ConflictException(`There aren't enough ${category.name} tickets left.`);
      }

      return transaction.ticketOrder.create({
        data: {
          userId,
          eventId,
          categoryId: category.id,
          quantity,
          totalCents,
          platformFeeCents,
          paymentMethod: freeOrder ? "FREE" : demoPayment ? "DEMO" : "PAYSTACK_BANK_TRANSFER",
          paymentStatus: freeOrder || demoPayment ? "PAID" : "PENDING",
          paymentReference: reference,
          confirmedAt: freeOrder || demoPayment ? new Date() : null,
          ticketsIssuedAt: freeOrder || demoPayment ? new Date() : null,
          tickets: !freeOrder && !demoPayment
            ? undefined
            : {
                create: Array.from({ length: quantity }, () => ({
                  code: randomUUID().replace(/-/g, "").toUpperCase(),
                })),
              },
        },
        include: {
          event: true,
          category: true,
          tickets: { select: { id: true, code: true, checkedInAt: true, issuedAt: true } },
        },
      });
    });

    if (!freeOrder && !demoPayment) {
      try {
        const [localPart, domain] = buyer.email.split("@");
        const paystackCustomer = await this.paystack.createCustomer({
          email: `${localPart.slice(0, 60)}+${order.id}@${domain}`,
          name: buyer.name,
          metadata: { order_id: order.id, payment_reference: reference },
        });
        await this.prisma.ticketOrder.update({
          where: { id: order.id },
          data: { paystackCustomerCode: paystackCustomer.customer_code },
        });
        const account = await this.paystack.createDedicatedAccount(paystackCustomer.customer_code);
        order = await this.prisma.ticketOrder.update({
          where: { id: order.id },
          data: {
            transferBankName: account.bank.name,
            transferAccountNumber: account.account_number,
            transferAccountName: account.account_name,
          },
          include: {
            event: true,
            category: true,
            tickets: { select: { id: true, code: true, checkedInAt: true, issuedAt: true } },
          },
        });
      } catch (error) {
        await this.prisma.$transaction(async (transaction) => {
          const rejected = await transaction.ticketOrder.updateMany({
            where: { id: order.id, paymentStatus: "PENDING" },
            data: { paymentStatus: "REJECTED" },
          });
          if (rejected.count === 1) {
            await transaction.event.update({
              where: { id: eventId },
              data: { ticketsSold: { decrement: quantity } },
            });
            await transaction.ticketCategory.update({
              where: { id: category.id },
              data: { ticketsSold: { decrement: quantity } },
            });
          }
        });
        throw error;
      }
    }

    const delivery = freeOrder
      ? await this.ticketEmail.sendTickets({
          email: buyer.email,
          name: buyer.name,
          event,
          tickets: order.tickets,
        })
      : demoPayment
        ? {
            sent: false as const,
            error: "Demo booking only. No payment was collected and no ticket email was sent.",
          }
      : {
          sent: false as const,
          error: "Tickets will be issued automatically after Paystack verifies your bank transfer.",
        };

    const { paystackCustomerCode: _providerCustomerCode, ...publicOrder } = order;
    return {
      ...publicOrder,
      tickets: await Promise.all(order.tickets.map(async (ticket) => ({
        ...ticket,
        qrDataUrl: await this.ticketEmail.qrDataUrl(ticket.code),
      }))),
      emailSent: delivery.sent,
      emailMessage: delivery.sent ? undefined : delivery.error,
    };
  }

  async getArtistBankAccount(artistId: string) {
    const artist = await this.prisma.user.findUnique({
      where: { id: artistId },
      select: { role: true, artistVerifiedAt: true },
    });
    if (!artist || artist.role !== "ARTIST") throw new NotFoundException("Artist profile not found.");
    if (!artist.artistVerifiedAt) return { verified: false, bankAccount: null };
    const account = await this.ensureArtistBankAccount(artistId);
    return {
      verified: true,
      bankAccount: {
        provider: account.provider,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
      },
    };
  }

  async verifyArtist(artistId: string) {
    const artist = await this.prisma.user.findUnique({ where: { id: artistId } });
    if (!artist || artist.role !== "ARTIST") throw new NotFoundException("Artist profile not found.");
    await this.prisma.user.update({
      where: { id: artistId },
      data: { artistVerifiedAt: artist.artistVerifiedAt ?? new Date() },
    });
    const account = await this.ensureArtistBankAccount(artistId);
    return {
      verified: true,
      bankAccount: {
        provider: account.provider,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
      },
    };
  }

  private async ensureArtistBankAccount(artistId: string) {
    const artist = await this.prisma.user.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, email: true, role: true, artistVerifiedAt: true },
    });
    if (!artist || artist.role !== "ARTIST" || !artist.artistVerifiedAt) {
      throw new ForbiddenException("Only verified artists can receive a Paystack bank account.");
    }

    let account = await this.prisma.artistBankAccount.findUnique({ where: { artistId } });
    if (account?.status === "ACTIVE") return account;
    if (account?.status === "CREATING") {
      const staleAt = new Date(Date.now() - 2 * 60 * 1000);
      if (account.updatedAt > staleAt) {
        throw new ConflictException("The artist bank account is still being created.");
      }
      const claimed = await this.prisma.artistBankAccount.updateMany({
        where: { id: account.id, status: "CREATING", updatedAt: account.updatedAt },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new ConflictException("The artist bank account is being created. Refresh and try again.");
      }
    } else if (account) {
      const claimed = await this.prisma.artistBankAccount.updateMany({
        where: { id: account.id, status: "FAILED" },
        data: { status: "CREATING" },
      });
      if (claimed.count !== 1) throw new ConflictException("The artist bank account is being created.");
    } else {
      try {
        account = await this.prisma.artistBankAccount.create({ data: { artistId } });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        throw new ConflictException("The artist bank account is being created.");
      }
    }

    try {
      let customerCode = account?.providerCustomerCode;
      if (!customerCode) {
        const [localPart, domain] = artist.email.split("@");
        const customer = await this.paystack.createCustomer({
          email: `${localPart.slice(0, 60)}+artist-${artist.id}@${domain}`,
          name: artist.name,
          metadata: { artist_id: artist.id },
        });
        customerCode = customer.customer_code;
        await this.prisma.artistBankAccount.update({
          where: { artistId },
          data: { providerCustomerCode: customerCode },
        });
      }
      const details = await this.paystack.createDedicatedAccount(customerCode);
      return await this.prisma.artistBankAccount.update({
        where: { artistId },
        data: {
          status: "ACTIVE",
          bankName: details.bank.name,
          accountNumber: details.account_number,
          accountName: details.account_name,
        },
      });
    } catch (error) {
      await this.prisma.artistBankAccount.updateMany({
        where: { artistId, status: "CREATING" },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }

  async handlePaystackWebhook(
    rawBody: Buffer | undefined,
    signature: string | string[] | undefined,
    body: unknown,
  ) {
    this.paystack.assertWebhookSignature(rawBody, signature);
    if (!body || typeof body !== "object" || !("event" in body) || !("data" in body)) {
      throw new BadRequestException("Invalid Paystack webhook payload.");
    }
    const payload = body as {
      event: string;
      data: {
        reference?: string;
        amount?: number;
        currency?: string;
        customer?: string | { customer_code?: string };
      };
    };
    if (payload.event !== "charge.success") {
      return { received: true, ignored: true };
    }
    const reference = payload.data.reference;
    const customerCode = typeof payload.data.customer === "string"
      ? payload.data.customer
      : payload.data.customer?.customer_code;
    if (!reference || !customerCode) {
      throw new BadRequestException("The Paystack charge is missing its reference or customer.");
    }

    const existing = await this.prisma.ticketOrder.findUnique({
      where: { paystackTransactionReference: reference },
      select: { id: true },
    });
    if (existing) return { received: true, processed: true };

    const order = await this.prisma.ticketOrder.findUnique({
      where: { paystackCustomerCode: customerCode },
      include: {
        event: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order) return { received: true, matched: false };
    if (order.paymentStatus !== "PENDING") return { received: true, processed: false };

    const verified = await this.paystack.verifyTransaction(reference);
    const verifiedCustomerCode = typeof verified.customer === "string"
      ? verified.customer
      : verified.customer?.customer_code;
    if (verified.status !== "success"
      || verified.reference !== reference
      || verifiedCustomerCode !== customerCode
      || verified.currency !== "NGN"
      || verified.amount !== order.totalCents
      || payload.data.amount !== order.totalCents
      || payload.data.currency !== "NGN") {
      throw new ConflictException("The Paystack transaction does not match the ticket order.");
    }

    const confirmedAt = new Date();
    const changed = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.ticketOrder.updateMany({
        where: {
          id: order.id,
          paymentStatus: "PENDING",
          paystackCustomerCode: customerCode,
          paystackTransactionReference: null,
        },
        data: {
          paymentStatus: "PAID",
          confirmedAt,
          ticketsIssuedAt: confirmedAt,
          paystackTransactionReference: reference,
        },
      });
      if (updated.count !== 1) return false;
      await transaction.ticket.createMany({
        data: Array.from({ length: order.quantity }, () => ({
          orderId: order.id,
          code: randomUUID().replace(/-/g, "").toUpperCase(),
        })),
      });
      return true;
    });
    if (!changed) return { received: true, processed: false };

    const tickets = await this.prisma.ticket.findMany({
      where: { orderId: order.id },
      select: { id: true, code: true, checkedInAt: true, issuedAt: true },
      orderBy: { issuedAt: "asc" },
    });
    await this.ticketEmail.sendTickets({
      email: order.user.email,
      name: order.user.name,
      event: order.event,
      tickets,
    });
    return { received: true, processed: true };
  }

  async checkIn(artistId: string, eventId: string, code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        order: {
          include: {
            event: { select: { id: true, title: true, artistId: true } },
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!ticket || ticket.order.eventId !== eventId) {
      throw new NotFoundException("Ticket code was not found for this event.");
    }
    if (ticket.order.event.artistId !== artistId) {
      throw new ForbiddenException("You can only check in tickets for your own events.");
    }
    if (ticket.order.paymentStatus !== "PAID") {
      throw new ConflictException("This ticket has not been paid for.");
    }
    if (ticket.order.paymentMethod !== "FREE" && ticket.order.paymentMethod !== "DEMO"
      && (ticket.order.paymentMethod !== "PAYSTACK_BANK_TRANSFER"
        || !ticket.order.paystackTransactionReference)) {
      throw new ConflictException("This ticket was not verified by a supported payment provider.");
    }
    if (ticket.checkedInAt) {
      throw new ConflictException("This ticket has already been checked in.");
    }

    const checkedInAt = new Date();
    const updated = await this.prisma.ticket.updateMany({
      where: { id: ticket.id, checkedInAt: null },
      data: { checkedInAt },
    });
    if (updated.count !== 1) {
      throw new ConflictException("This ticket has already been checked in.");
    }
    return {
      code: ticket.code,
      attendee: ticket.order.user.name,
      event: ticket.order.event.title,
      checkedInAt,
    };
  }
}
