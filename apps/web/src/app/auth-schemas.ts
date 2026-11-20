import { z } from "zod";

export const MUSIC_GENRES = [
  "Afrobeats",
  "Amapiano",
  "Afropop",
  "Afro-fusion",
  "Gospel",
  "Hip-hop",
  "R&B",
  "Pop",
  "Dancehall",
  "Highlife",
  "Jazz",
  "Alternative",
  "Electronic",
  "Other",
] as const;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.")
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password needs a letter and a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60, "Name is too long."),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit reset code."),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const searchSchema = z.object({
  query: z.string().trim().max(100, "Search is too long."),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  city: z.string().trim().max(80, "City name is too long."),
});

export const citySchema = z.object({
  city: z.string().trim().max(80, "City name is too long."),
});

export const playlistCreateSchema = z.object({
  name: z.string().trim().min(1, "Playlist name is required.").max(60, "Playlist name is too long."),
  description: z.string().trim().max(240, "Description is too long.").optional().or(z.literal("")),
});

export const playlistAddSchema = z.object({
  playlistId: z.string().trim().min(1, "Choose a playlist."),
});

export const uploadReleaseSchema = z
  .object({
    artistName: z.string().trim().min(1, "Artist name is required.").max(100, "Artist name is too long."),
    releaseType: z.enum(["SINGLE", "ALBUM"]),
    genre: z.enum(MUSIC_GENRES, { error: "Choose a genre." }),
    title: z.string().trim().max(100, "Track title is too long.").optional().or(z.literal("")),
    albumTitle: z.string().trim().max(100, "Album title is too long.").optional().or(z.literal("")),
    releaseDescription: z.string().trim().max(500, "Description is too long.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.releaseType === "SINGLE" && !value.title?.trim()) {
      ctx.addIssue({ code: "custom", message: "Track title is required.", path: ["title"] });
    }
    if (value.releaseType === "ALBUM" && !value.albumTitle?.trim()) {
      ctx.addIssue({ code: "custom", message: "Album title is required.", path: ["albumTitle"] });
    }
  });

export const updateTrackSchema = z.object({
  title: z.string().trim().min(1, "Track title is required.").max(100, "Track title is too long."),
  genre: z.enum(MUSIC_GENRES, { error: "Choose a genre." }),
  albumTitle: z.string().trim().max(100, "Album title is too long.").optional().or(z.literal("")),
  releaseDescription: z.string().trim().max(500, "Description is too long.").optional().or(z.literal("")),
});

export const ticketCategorySchema = z.object({
  name: z.string().trim().min(2, "Ticket category needs a name.").max(60, "Category name is too long."),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(1_000_000, "Price is too high."),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(100_000, "Capacity is too high."),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(2, "Event title is required.").max(100, "Event title is too long."),
  venue: z.string().trim().min(2, "Venue is required.").max(100, "Venue is too long."),
  city: z.string().trim().min(2, "City is required.").max(80, "City is too long."),
  startsAt: z
    .string()
    .trim()
    .min(1, "Start time is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid start time.")
    .refine((value) => new Date(value).getTime() > Date.now(), "Start time must be in the future."),
  ticketCategories: z.array(ticketCategorySchema).min(1, "Add at least one ticket category.").max(10, "Too many ticket categories."),
});

export const addCapacitySchema = z.object({
  additionalTickets: z.coerce
    .number()
    .int("Enter a whole number of tickets.")
    .min(1, "Add at least 1 ticket.")
    .max(100_000, "That is too many tickets."),
});

export const eventNotificationSchema = z.object({
  message: z.string().trim().min(2, "Write a short message.").max(1000, "Message is too long."),
});

export const purchaseTicketsSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Buy at least 1 ticket.").max(10, "You can buy up to 10 tickets."),
  categoryId: z.string().trim().max(100, "Ticket category is invalid.").optional().or(z.literal("")),
});

export const checkInSchema = z.object({
  code: z.string().trim().min(8, "Enter a valid ticket code.").max(100, "Ticket code is too long."),
});

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check your input.";
}
