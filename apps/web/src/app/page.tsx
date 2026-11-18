"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  BellRing,
  Check,
  ChevronDown,
  Compass,
  CreditCard,
  Disc3,
  Download,
  Eye,
  EyeOff,
  FileAudio2,
  Headphones,
  Heart,
  Home,
  ImagePlus,
  Info,
  AlertTriangle,
  LogOut,
  Link2,
  ListMusic,
  Maximize2,
  MapPin,
  Menu,
  Minimize2,
  Mic2,
  Music2,
  QrCode,
  Pause,
  Play,
  Plus,
  Pencil,
  Repeat,
  Search,
  Settings,
  Shuffle,
  Sun,
  Moon,
  Ticket,
  ScanLine,
  CalendarDays,
  Clock3,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
  Users,
  Volume2,
  X,
} from "lucide-react";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  searchSchema,
  settingsSchema,
  signupSchema,
  verifyEmailSchema,
  zodErrorMessage,
} from "./auth-schemas";
import { applyTheme, resolveTheme, type WiloplayTheme } from "./theme-initializer";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Track = {
  id: string | number;
  artistProfileId?: string;
  title: string;
  artist: string;
  cover: string;
  preview?: string;
  audioUrl?: string;
  providerTrackId?: string;
  duration?: number;
  album?: string;
  albumTitle?: string | null;
  releaseDescription?: string | null;
  enhancedAudioUrl?: string | null;
  aiProductionStatus?: string | null;
  genre?: string;
  releaseType?: "SINGLE" | "ALBUM";
  deezerUrl?: string;
  provider?: string;
  playback?: "full" | "preview";
  attribution?: string;
};

type CatalogTrack = {
  id: string;
  provider: "audius" | "jamendo" | "deezer" | "itunes";
  providerTrackId: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  duration?: number;
  genres: string[];
  previewUrl?: string;
  streamUrl?: string;
  externalUrl?: string;
  playback: "full" | "preview";
  attribution?: string;
};

type ApiTrack = {
  id: string;
  artistId: string;
  title: string;
  artistName: string;
  audioUrl: string;
  coverUrl: string | null;
  genre: string;
  releaseType: "SINGLE" | "ALBUM";
  albumTitle: string | null;
  releaseDescription: string | null;
  enhancedAudioUrl?: string | null;
  aiProductionStatus?: string | null;
  duration: number | null;
};

type LibraryEntry = {
  id?: string;
  source: "UPLOAD" | "DEEZER" | "AUDIUS" | "JAMENDO" | "ITUNES";
  sourceTrackId?: string;
  externalTrackId?: string | null;
  title: string;
  artistName: string;
  albumTitle?: string | null;
  coverUrl?: string | null;
  previewUrl?: string | null;
  deezerUrl?: string | null;
  duration?: number | null;
  genre?: string | null;
  track?: ApiTrack | null;
  playedAt?: string;
};

type Playlist = {
  id: string;
  name: string;
  description: string | null;
  _count?: { tracks: number };
};

type PlaylistDetails = Playlist & {
  tracks: (LibraryEntry & { position: number })[];
};

type PlaylistDialog = { mode: "create" | "add"; track: Track | null } | null;

type ChartArtist = {
  id: number;
  name: string;
  picture: string;
  deezerUrl: string;
};

type ArtistProfile = ChartArtist & {
  fans: number;
};

type ChartAlbum = {
  id: number;
  title: string;
  artist: string;
  cover: string;
  deezerUrl: string;
};

type DeezerChart = {
  tracks: Track[];
  artists: ChartArtist[];
  albums: ChartAlbum[];
};

type AiConfiguration = {
  openAiEnabled: boolean;
  auphonicEnabled: boolean;
};

type ReleaseSuggestions = {
  title: string;
  genre: string;
  releaseDescription: string;
};

type EnhancementStatus = {
  status: string | null;
  enhancedAudioUrl?: string | null;
  message?: string;
};

type ArtistDetails = {
  artist: ArtistProfile;
  tracks: Track[];
};

type EventItem = {
  id: string;
  title: string;
  artistName: string;
  venue: string;
  city: string;
  startsAt: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
  coverUrl?: string;
  ticketCategories: TicketCategory[];
};

type TicketCategory = {
  id: string;
  name: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
};

type ArtistBankAccount = {
  provider: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
};

type User = { id: string; name: string; email: string; role: string; emailVerifiedAt?: string | null };
type AuthSession = { accessToken: string; user: User };
type EmailVerificationChallenge = {
  verificationRequired: true;
  email: string;
  expiresInSeconds: number;
  sent: boolean;
};
type EmailVerificationStatus = { emailVerifiedAt: string };
type AuthResponse = AuthSession | EmailVerificationChallenge;
type TicketItem = {
  id: string;
  code: string;
  checkedInAt: string | null;
  issuedAt?: string;
  qrDataUrl?: string;
};
type TicketOrder = {
  id: string;
  quantity: number;
  totalCents: number;
  platformFeeCents: number;
  paymentMethod: string;
  paymentStatus: "PENDING" | "PAID" | "REJECTED";
  paymentReference: string | null;
  transferBankName: string | null;
  transferAccountNumber: string | null;
  transferAccountName: string | null;
  category?: TicketCategory | null;
  createdAt: string;
  confirmedAt: string | null;
  event: EventItem;
  tickets: TicketItem[];
  user?: { id: string; name: string; email: string };
};
type ArtistEvent = EventItem & {
  orders: Omit<TicketOrder, "event">[];
  paidTickets: number;
  demoTickets: number;
  pendingTickets: number;
  revenueCents: number;
  platformFeesCents: number;
};
type ArtistTicketCategoryDraft = { name: string; price: string; capacity: string };
type UploadDraft = {
  artistName: string;
  title: string;
  albumTitle: string;
  genre: string;
  releaseDescription: string;
};
type EventDraft = { title: string; venue: string; city: string; startsAt: string };
type PurchaseResult = TicketOrder & {
  emailSent: boolean;
  emailMessage?: string;
};
type PaymentMode = "demo" | "paystack";
type Modal = "login" | "signup" | "email-verification" | "forgot-password" | "reset-password" | "settings" | "upload" | "event" | "checkout" | "purchase-result" | null;
type PasswordResetChallenge = {
  accepted: true;
  email: string;
  message: string;
  expiresInSeconds?: number;
  sent?: boolean;
};
type SearchArtistHit = {
  id: string;
  name: string;
  followers: number;
  trackCount: number;
  coverUrl: string | null;
  artistName: string;
};
type SearchEventHit = {
  id: string;
  title: string;
  artistName: string;
  venue: string;
  city: string;
  startsAt: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
  coverUrl: string | null;
};
type SearchResponse = {
  query: string;
  tracks: ApiTrack[];
  artists: SearchArtistHit[];
  events: SearchEventHit[];
  catalogTracks: CatalogTrack[];
  deezerTracks: Track[];
  totals: {
    tracks: number;
    artists: number;
    events: number;
    catalogTracks: number;
    deezerTracks: number;
    all: number;
  };
};
type SearchFilter = "all" | "wiloplay" | "catalog" | "artists" | "shows";
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => {
  detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};

const moods = [
  {
    label: "Find your flow",
    sub: "Warm sounds for slow mornings",
    art: "photo-1470252649378-9c29740c9fa8",
    color: "#b18a67",
    query: "indie chill",
  },
  {
    label: "After hours",
    sub: "The night's only getting started",
    art: "photo-1519608487953-e999c86e7455",
    color: "#7761bc",
    query: "electronic",
  },
  {
    label: "Soft landing",
    sub: "A gentler way to wind down",
    art: "photo-1470252649378-9c29740c9fa8",
    color: "#8f9c73",
    query: "acoustic",
  },
  {
    label: "Main character",
    sub: "This is your movie montage",
    art: "photo-1470225620780-dba8ba36b745",
    color: "#cf8055",
    query: "pop hits",
  },
];

const heroSlides = [
  {
    image: "https://images.pexels.com/photos/9522857/pexels-photo-9522857.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Black rapper performing into a microphone",
    category: "ARTIST SPOTLIGHT",
    title: "A new sound is rising.",
    detail: "Meet the voices shaping what comes next.",
  },
  {
    image: "https://images.pexels.com/photos/32701414/pexels-photo-32701414.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "African musicians performing at an outdoor music gathering",
    category: "LIVE · ROOTED IN RHYTHM",
    title: "Feel every note together.",
    detail: "Find the next live moment worth remembering.",
  },
  {
    image: "https://images.pexels.com/photos/15188114/pexels-photo-15188114.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Black podcast host recording beside a microphone",
    category: "PODCAST · THE CREATIVE ROOM",
    title: "More than the music.",
    detail: "Conversations with the people behind the sound.",
  },
];

const musicGenres = [
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
];

class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(
  path: string,
  token?: string | null,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.filter((item): item is string => typeof item === "string").join(" ")
      : typeof rawMessage === "string"
        ? rawMessage
        : response.status === 401
          ? "Your sign-in details could not be verified."
          : "Something went wrong. Please try again.";
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<T>;
}

function authErrorMessage(reason: unknown, fallback: string) {
  if (
    reason instanceof TypeError
    || (reason instanceof Error && /failed to fetch|networkerror/i.test(reason.message))
  ) {
    return "We couldn't reach Wiloplay. Check your connection and try again.";
  }
  if (reason instanceof ApiRequestError && reason.status === 429) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (reason instanceof ApiRequestError && reason.status >= 500) {
    return reason.message && reason.message !== "Something went wrong. Please try again."
      ? `${reason.message} Please try again shortly.`
      : "Wiloplay couldn't complete this request right now. Please try again shortly.";
  }
  return reason instanceof Error ? reason.message : fallback;
}

function formatTime(seconds?: number) {
  if (!seconds) return "—:—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function lyricsSearchUrl(track: Pick<Track, "title" | "artist">) {
  return `https://genius.com/search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`;
}

function apiTrackToPlayerTrack(track: ApiTrack): Track {
  return {
    id: track.id,
    artistProfileId: track.artistId,
    title: track.title,
    artist: track.artistName,
    cover: track.coverUrl ? `${API}${track.coverUrl}` : "",
    audioUrl: `${API}${track.enhancedAudioUrl ?? track.audioUrl}`,
    enhancedAudioUrl: track.enhancedAudioUrl ? `${API}${track.enhancedAudioUrl}` : null,
    duration: track.duration ?? undefined,
    genre: track.genre,
    releaseType: track.releaseType,
    albumTitle: track.albumTitle,
    releaseDescription: track.releaseDescription,
    provider: "wiloplay",
    playback: "full",
  };
}

function catalogTrackToPlayerTrack(track: CatalogTrack): Track {
  const playUrl = track.streamUrl || track.previewUrl || undefined;
  return {
    id: track.id,
    providerTrackId: track.providerTrackId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    cover: track.cover ?? "",
    preview: track.playback === "preview" ? playUrl : playUrl,
    audioUrl: track.playback === "full" ? playUrl : undefined,
    duration: track.duration,
    deezerUrl: track.externalUrl,
    genre: track.genres[0],
    provider: track.provider,
    playback: track.playback,
    attribution: track.attribution,
  };
}

function catalogProviderLabel(provider?: string) {
  if (provider === "audius") return "Audius";
  if (provider === "jamendo") return "Jamendo";
  if (provider === "itunes") return "iTunes";
  if (provider === "deezer") return "Deezer";
  if (provider === "wiloplay") return "Wiloplay";
  return provider ? provider : "Catalog";
}

function libraryEntryToPlayerTrack(entry: LibraryEntry): Track {
  if (entry.track) return apiTrackToPlayerTrack(entry.track);
  const externalId = entry.sourceTrackId ?? entry.externalTrackId ?? "";
  return {
    id: entry.source === "DEEZER" ? Number(externalId) : externalId,
    providerTrackId: entry.source === "UPLOAD" ? undefined : externalId,
    title: entry.title,
    artist: entry.artistName,
    album: entry.albumTitle ?? undefined,
    cover: entry.coverUrl ?? "",
    preview: entry.previewUrl ?? undefined,
    deezerUrl: entry.deezerUrl ?? undefined,
    duration: entry.duration ?? undefined,
    genre: entry.genre ?? undefined,
    provider: entry.source === "UPLOAD" ? "wiloplay" : entry.source.toLowerCase(),
  };
}

function libraryTrackKey(track: Track) {
  const source = libraryTrackSource(track) ?? "CATALOG";
  return `${source}:${track.providerTrackId ?? track.id}`;
}

function libraryTrackSource(track: Track): LibraryEntry["source"] | null {
  switch (track.provider) {
    case "audius": return "AUDIUS";
    case "jamendo": return "JAMENDO";
    case "deezer": return "DEEZER";
    case "itunes": return "ITUNES";
    default:
      if (track.provider && track.provider !== "wiloplay") return null;
      return typeof track.id === "number" || track.preview ? "DEEZER" : "UPLOAD";
  }
}

function libraryTrackPayload(track: Track, requirePlayable = true) {
  const source = libraryTrackSource(track);
  if (!source) throw new Error("This music source cannot be saved yet.");
  if (source === "UPLOAD") return { source, trackId: String(track.id) };

  const playUrl = track.preview ?? track.audioUrl;
  if (requirePlayable && !playUrl) throw new Error("This catalog track has no playable audio.");
  return {
    source,
    externalTrackId: track.providerTrackId ?? String(track.id),
    title: track.title,
    artistName: track.artist,
    albumTitle: track.album ?? track.albumTitle ?? undefined,
    coverUrl: track.cover || undefined,
    ...(playUrl ? { previewUrl: playUrl } : {}),
    deezerUrl: track.deezerUrl,
    duration: track.duration && track.duration > 0 ? track.duration : undefined,
    genre: track.genre,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatPrice(cents: number) {
  return cents === 0 ? "Free" : new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function platformFeeCents(subtotalCents: number) {
  return Math.round(subtotalCents * 0.1);
}

function EventCountdown({ startsAt, ticket = false }: { startsAt: string; ticket?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.floor((new Date(startsAt).getTime() - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return (
    <span className={ticket ? "ticket-countdown" : "event-countdown"}>
      <Clock3 size={13} />
      {days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
      <small>{ticket ? "until showtime" : "to showtime"}</small>
    </span>
  );
}

function Cover({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`cover ${className}`}
      style={{ backgroundImage: `url("${src}")` }}
    />
  );
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function WizardProgress({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="wizard-progress" role="list" aria-label="Form progress">
      {steps.map((step, index) => (
        <div
          className={`wizard-progress-step${index === activeStep ? " is-active" : ""}${index < activeStep ? " is-complete" : ""}`}
          role="listitem"
          aria-current={index === activeStep ? "step" : undefined}
          key={step}
        >
          <span className="wizard-step-number">{index < activeStep ? <Check size={14} /> : index + 1}</span>
          <span className="wizard-step-label">{step}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [chart, setChart] = useState<DeezerChart | null>(null);
  const [chartError, setChartError] = useState("");
  const [chartLoading, setChartLoading] = useState(true);
  const [catalogGenres, setCatalogGenres] = useState<string[]>([]);
  const [activeCatalogGenre, setActiveCatalogGenre] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(null);
  const [loadingArtistId, setLoadingArtistId] = useState<number | null>(null);
  const [artistDetailsError, setArtistDetailsError] = useState("");
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [likedTrackKeys, setLikedTrackKeys] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [listeningHistory, setListeningHistory] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [libraryTab, setLibraryTab] = useState<"recommendations" | "liked" | "history" | "playlist">("recommendations");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [playlistDialog, setPlaylistDialog] = useState<PlaylistDialog>(null);
  const [playlistNameDraft, setPlaylistNameDraft] = useState("");
  const [playlistDescriptionDraft, setPlaylistDescriptionDraft] = useState("");
  const [playlistChoiceId, setPlaylistChoiceId] = useState("");
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myTicketOrders, setMyTicketOrders] = useState<TicketOrder[]>([]);
  const [artistEvents, setArtistEvents] = useState<ArtistEvent[]>([]);
  const [artistBankAccount, setArtistBankAccount] = useState<ArtistBankAccount | null>(null);
  const [artistVerified, setArtistVerified] = useState(false);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [aiConfiguration, setAiConfiguration] = useState<AiConfiguration | null>(null);
  const [trackSuggestions, setTrackSuggestions] = useState<Record<string, ReleaseSuggestions>>({});
  const [uploadReleaseType, setUploadReleaseType] = useState<"SINGLE" | "ALBUM">("SINGLE");
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({
    artistName: "",
    title: "",
    albumTitle: "",
    genre: "Afrobeats",
    releaseDescription: "",
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const uploadCoverPreview = useObjectUrl(uploadCoverFile);
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | number | null>(null);
  const [eventStep, setEventStep] = useState(0);
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    title: "",
    venue: "",
    city: "",
    startsAt: "",
  });
  const [eventCoverFile, setEventCoverFile] = useState<File | null>(null);
  const eventCoverPreview = useObjectUrl(eventCoverFile);
  const eventFormRef = useRef<HTMLFormElement>(null);
  const [additionalTickets, setAdditionalTickets] = useState(50);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<EventItem | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedTicketCategoryId, setSelectedTicketCategoryId] = useState("");
  const [ticketCategoryDrafts, setTicketCategoryDrafts] = useState<ArtistTicketCategoryDraft[]>([
    { name: "Regular", price: "5000", capacity: "100" },
  ]);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [selectedSalesEventId, setSelectedSalesEventId] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInError, setCheckInError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [volume, setVolume] = useState(0.75);
  const [queueOpen, setQueueOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [cityDraft, setCityDraft] = useState("");
  const [listenCity, setListenCity] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLeaving, setSearchLeaving] = useState(false);
  const [searchMinimized, setSearchMinimized] = useState(true);
  const [activeNav, setActiveNav] = useState<
    "home" | "discovery" | "for-you" | "shows" | "my-tickets"
  >("home");
  const [theme, setTheme] = useState<WiloplayTheme>("dark");
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroAutoplayPaused, setHeroAutoplayPaused] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "" });
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationPassword, setVerificationPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPasswordDraft, setResetPasswordDraft] = useState("");
  const [resetExpiresInSeconds, setResetExpiresInSeconds] = useState(600);
  const [verificationExpiresInSeconds, setVerificationExpiresInSeconds] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    tone: "success" | "info" | "error";
    leaving?: boolean;
  }>>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [paymentModeError, setPaymentModeError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimers = useRef<Map<string, number>>(new Map());
  const artistDetailsRequestId = useRef(0);
  const countedListenTrackId = useRef<string | null>(null);
  const listenPlaybackId = useRef("");
  const historySavedPlaybackId = useRef<string | null>(null);

  useEffect(() => {
    const sectionIds: (typeof activeNav)[] = [
      "discovery",
      "for-you",
      "shows",
      "my-tickets",
    ];
    const updateActiveNav = () => {
      const activationLine = window.innerHeight * 0.32;
      let nextSection: typeof activeNav = "home";

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= activationLine) {
          nextSection = id;
        }
      }

      setActiveNav((current) => current === nextSection ? current : nextSection);
    };

    updateActiveNav();
    window.addEventListener("scroll", updateActiveNav, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveNav);
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const results = await request<EventItem[]>("/events");
      setEvents(results);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void request<{ mode: PaymentMode }>("/events/payment-mode")
      .then(({ mode }) => {
        if (active) setPaymentMode(mode);
      })
      .catch((reason: unknown) => {
        if (active) {
          setPaymentModeError(reason instanceof Error ? reason.message : "Payment options could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token || !user || user.emailVerifiedAt !== undefined) return;
    let active = true;
    void request<EmailVerificationChallenge | EmailVerificationStatus | AuthSession>(
      "/auth/request-email-verification",
      token,
      { method: "POST" },
    ).then((result) => {
      if (!active) return;
      if ("verificationRequired" in result) {
        setVerificationEmail(result.email);
        setVerificationExpiresInSeconds(result.expiresInSeconds);
        setVerificationCode("");
        setModal("email-verification");
        showMessage(result.sent
          ? `A verification code was sent to ${result.email}.`
          : `A verification code was already sent to ${result.email}.`);
      } else if ("accessToken" in result) {
        establishSession(result, "Your email is verified. Welcome to Wiloplay.");
      } else {
        const verifiedUser = { ...user, emailVerifiedAt: result.emailVerifiedAt };
        localStorage.setItem("sonora-user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      }
    }).catch((reason: unknown) => {
      if (active) {
        showMessage(reason instanceof Error ? reason.message : "Email verification could not be started.");
      }
    });
    return () => {
      active = false;
    };
  }, [token, user]);

  const loadMyTicketOrders = useCallback(async () => {
    if (!token) return;
    try {
      const orders = await request<TicketOrder[]>("/events/my-tickets", token);
      setMyTicketOrders(orders);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your tickets could not be loaded.");
    }
  }, [token]);

  const loadArtistEvents = useCallback(async () => {
    if (!token || user?.role !== "ARTIST") return;
    try {
      const results = await request<ArtistEvent[]>("/events/mine", token);
      setArtistEvents(results);
      setSelectedSalesEventId((selected) =>
        results.some((item) => item.id === selected) ? selected : results[0]?.id ?? "",
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your sales dashboard could not be loaded.");
    }
  }, [token, user?.role]);

  const loadArtistBankAccount = useCallback(async () => {
    if (!token || user?.role !== "ARTIST") return;
    try {
      const result = await request<{ verified: boolean; bankAccount: ArtistBankAccount | null }>(
        "/payments/artist-bank-account",
        token,
      );
      setArtistVerified(result.verified);
      setArtistBankAccount(result.bankAccount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your artist bank account could not be loaded.");
    }
  }, [token, user?.role]);

  const loadArtistTracks = useCallback(async () => {
    if (!token || user?.role !== "ARTIST") return;
    try {
      const saved = await request<
        (Track & { artistName: string; coverUrl?: string | null; audioUrl: string })[]
      >("/tracks/mine", token);
      setArtistTracks(saved.map((track) => ({
        ...track,
        artist: track.artistName,
        cover: track.coverUrl ? `${API}${track.coverUrl}` : "",
        audioUrl: `${API}${track.audioUrl}`,
        enhancedAudioUrl: track.enhancedAudioUrl ? `${API}${track.enhancedAudioUrl}` : null,
      })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your music could not be loaded.");
    }
  }, [token, user?.name, user?.role]);

  const loadUploads = useCallback(async () => {
    try {
      const saved = await request<
        (Track & { artistName: string; artistId: string; audioUrl: string; coverUrl?: string | null })[]
      >("/tracks");
      setUploadedTracks(saved.map((track) => ({
        id: track.id,
        artistProfileId: track.artistId,
        title: track.title,
        artist: track.artistName,
        cover: track.coverUrl ? `${API}${track.coverUrl}` : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
        audioUrl: `${API}${track.enhancedAudioUrl ?? track.audioUrl}`,
        enhancedAudioUrl: track.enhancedAudioUrl ? `${API}${track.enhancedAudioUrl}` : null,
        duration: track.duration,
        genre: track.genre,
        releaseType: track.releaseType,
        albumTitle: track.albumTitle,
        releaseDescription: track.releaseDescription,
      })));
    } catch {
      setError("Your music library could not be loaded. Check that the API is running.");
    }
  }, []);

  const loadListenerLibrary = useCallback(async () => {
    if (!token) {
      setLikedTracks([]);
      setLikedTrackKeys([]);
      setPlaylists([]);
      setPlaylistDetails(null);
      setListeningHistory([]);
      setRecommendations([]);
      setLibraryError("");
      return;
    }

    setLibraryLoading(true);
    try {
      const [likes, history, savedPlaylists, suggested] = await Promise.all([
        request<LibraryEntry[]>("/library/likes", token),
        request<LibraryEntry[]>("/library/history", token),
        request<Playlist[]>("/playlists", token),
        request<ApiTrack[]>("/library/recommendations", token),
      ]);
      setLikedTracks(likes.map(libraryEntryToPlayerTrack));
      setLikedTrackKeys(likes.map((entry) =>
        `${entry.source}:${entry.sourceTrackId ?? entry.externalTrackId ?? entry.track?.id ?? ""}`,
      ));
      setListeningHistory(history.map(libraryEntryToPlayerTrack));
      setPlaylists(savedPlaylists);
      setPlaylistChoiceId((selected) =>
        savedPlaylists.some((item) => item.id === selected)
          ? selected
          : savedPlaylists[0]?.id ?? "",
      );
      setRecommendations(suggested.map(apiTrackToPlayerTrack));
      setLibraryError("");
    } catch (reason) {
      setLibraryError(reason instanceof Error
        ? reason.message
        : "Your listening library could not be loaded.");
    } finally {
      setLibraryLoading(false);
    }
  }, [token]);

  const loadCatalogTrending = useCallback(async () => {
    try {
      const results = await request<{ tracks: CatalogTrack[] }>("/catalog/trending?limit=24");
      setTracks(results.tracks.map(catalogTrackToPlayerTrack));
    } catch {
      // Keep any existing tracks; chart/search can still fill discovery.
    }
  }, []);

  const loadCatalogGenres = useCallback(async () => {
    try {
      const results = await request<{ genres: string[] }>("/catalog/genres");
      setCatalogGenres(results.genres ?? []);
    } catch {
      setCatalogGenres([]);
    }
  }, []);

  const searchTracks = useCallback(async (term: string) => {
    setSearchError("");
    setSearchFilter("all");
    setActiveCatalogGenre(null);
    if (!term.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      setError("");
      void loadCatalogTrending();
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const results = await request<SearchResponse>(`/search?q=${encodeURIComponent(term.trim())}`);
      const catalogTracks = results.catalogTracks ?? [];
      const playable = catalogTracks.map(catalogTrackToPlayerTrack);
      setSearchResults({
        ...results,
        catalogTracks,
        totals: {
          ...results.totals,
          catalogTracks: catalogTracks.length,
          deezerTracks: results.totals.deezerTracks ?? playable.filter((track) => track.provider === "deezer").length,
        },
      });
      setTracks(playable);
      setError("");
      if (!results.totals.all) {
        setSearchError("Nothing matched that search yet. Try another artist, song, mood, or city.");
      }
    } catch {
      setTracks([]);
      setSearchResults(null);
      setSearchError("Search is having a quiet moment. Your Wiloplay artist releases are still here.");
    } finally {
      setSearchLoading(false);
    }
  }, [loadCatalogTrending]);

  const browseCatalogGenre = useCallback(async (genre: string) => {
    setSearchError("");
    setSearchFilter("catalog");
    setActiveCatalogGenre(genre);
    setQuery(genre);
    setSearchLoading(true);
    try {
      const results = await request<{ tracks: CatalogTrack[] }>(
        `/catalog/genres/${encodeURIComponent(genre)}?limit=24`,
      );
      const playable = results.tracks.map(catalogTrackToPlayerTrack);
      setTracks(playable);
      setSearchResults(null);
      setError("");
      if (!playable.length) {
        setSearchError(`No ${genre} tracks came back just yet. Try another genre or search.`);
      }
    } catch {
      setSearchError("Genre browsing is having a quiet moment. Try search instead.");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const loadChart = useCallback(async () => {
    setChartLoading(true);
    setChartError("");
    try {
      const results = await request<DeezerChart>("/deezer/chart");
      setChart(results);
    } catch {
      setChart(null);
      setChartError("The charts are taking a breather. Explore Wiloplay artist releases while they load back in.");
    } finally {
      setChartLoading(false);
    }
  }, []);

  async function loadArtistDetails(artist: ChartArtist) {
    const requestId = ++artistDetailsRequestId.current;
    setArtistDetails(null);
    setArtistDetailsError("");
    setLoadingArtistId(artist.id);
    try {
      const details = await request<ArtistDetails>(`/deezer/artists/${artist.id}`);
      if (requestId === artistDetailsRequestId.current) setArtistDetails(details);
    } catch (reason) {
      if (requestId === artistDetailsRequestId.current) {
        setArtistDetailsError(reason instanceof Error ? reason.message : "Artist details could not be loaded.");
      }
    } finally {
      if (requestId === artistDetailsRequestId.current) setLoadingArtistId(null);
    }
  }

  useEffect(() => {
    const initialTheme = resolveTheme(
      localStorage.getItem("wiloplay-theme"),
      window.matchMedia("(prefers-color-scheme: light)").matches,
    );
    setTheme(initialTheme);
    applyTheme(initialTheme);
    const savedToken = localStorage.getItem("sonora-token");
    const savedUser = localStorage.getItem("sonora-user");
    const savedCity = localStorage.getItem("wiloplay-listener-city") ?? "";
    setCityDraft(savedCity);
    setListenCity(savedCity);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser) as User);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      if (!savedToken) {
        setAuthMode("login");
        setModal("login");
      }
      params.delete("login");
      const queryString = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`,
      );
    }
    loadEvents();
    loadUploads();
    void searchTracks("indie chill");
    void loadChart();
    void loadCatalogGenres();
    void loadCatalogTrending();
    const sharedTrackId = new URLSearchParams(window.location.search).get("track");
    if (sharedTrackId) {
      void request<Track & { artistName: string; coverUrl?: string | null }>(
        `/tracks/${encodeURIComponent(sharedTrackId)}`,
      ).then((track) => {
        setCurrent({
          ...track,
          artist: track.artistName,
          cover: track.coverUrl
            ? `${API}${track.coverUrl}`
            : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
          audioUrl: `${API}${track.enhancedAudioUrl ?? track.audioUrl}`,
          enhancedAudioUrl: track.enhancedAudioUrl ? `${API}${track.enhancedAudioUrl}` : null,
        });
      }).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "The shared track could not be loaded.");
      });
    }
  }, [loadCatalogGenres, loadCatalogTrending, loadChart, loadEvents, loadUploads, searchTracks]);

  useEffect(() => {
    if (!token || !user) return;
    void loadMyTicketOrders();
    void loadListenerLibrary();
    if (user.role === "ARTIST") {
      void loadArtistEvents();
      void loadArtistBankAccount();
      void loadArtistTracks();
      void request<AiConfiguration>("/tracks/ai/config", token).then(setAiConfiguration).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "AI tools could not be checked.");
      });
    }
  }, [loadArtistBankAccount, loadArtistEvents, loadArtistTracks, loadListenerLibrary, loadMyTicketOrders, token, user]);

  useEffect(() => {
    const starts = [
      ...events.map((event) => new Date(event.startsAt).getTime()),
      ...myTicketOrders.map((order) => new Date(order.event.startsAt).getTime()),
    ].filter((start) => start > now);
    if (!starts.length) return;

    const nextStart = Math.min(...starts);
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(nextStart - Date.now() + 10, 0),
    );
    return () => window.clearTimeout(timer);
  }, [events, myTicketOrders, now]);

  useEffect(() => {
    const sharedEventId = new URLSearchParams(window.location.search).get("event");
    if (!sharedEventId || !events.some((event) => event.id === sharedEventId)) return;
    document.getElementById(`event-${sharedEventId}`)?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  useEffect(() => {
    if (!token || !myTicketOrders.some((order) => order.paymentStatus === "PENDING")) return;
    const timer = window.setInterval(() => void loadMyTicketOrders(), 10000);
    return () => window.clearInterval(timer);
  }, [loadMyTicketOrders, myTicketOrders, token]);

  useEffect(() => {
    if (!token || user?.role !== "ARTIST") return;
    const pending = artistTracks.filter((track) =>
      track.aiProductionStatus
      && !["Done", "Error", "Incomplete"].includes(track.aiProductionStatus),
    );
    if (!pending.length) return;

    const timer = window.setInterval(() => {
      for (const track of pending) {
        void request<EnhancementStatus>(
          `/tracks/${encodeURIComponent(String(track.id))}/enhancement`,
          token,
        ).then((result) => {
          setArtistTracks((old) => old.map((item) => item.id === track.id ? {
            ...item,
            aiProductionStatus: result.status,
            enhancedAudioUrl: result.enhancedAudioUrl
              ? `${API}${result.enhancedAudioUrl}`
              : item.enhancedAudioUrl,
          } : item));
          if (result.enhancedAudioUrl) {
            setUploadedTracks((old) => old.map((item) => item.id === track.id ? {
              ...item,
              audioUrl: `${API}${result.enhancedAudioUrl}`,
              enhancedAudioUrl: `${API}${result.enhancedAudioUrl}`,
              aiProductionStatus: result.status,
            } : item));
          }
          if (result.status === "Error" && result.message) setError(result.message);
        }).catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : "Audio processing status could not be checked.");
        });
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [artistTracks, token, user?.role]);

  useEffect(() => {
    if (!scannerOpen) return;
    const detectorType = (window as Window & {
      BarcodeDetector?: BarcodeDetectorConstructor;
    }).BarcodeDetector;
    if (!detectorType || !navigator.mediaDevices?.getUserMedia) {
      setCheckInError("QR camera scanning is not supported here. Enter the ticket code instead.");
      setScannerOpen(false);
      return;
    }

    let active = true;
    let stream: MediaStream | null = null;
    let animationFrame = 0;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (!active || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new detectorType({ formats: ["qr_code"] });
        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results[0]?.rawValue) {
              setTicketCode(results[0].rawValue);
              setScannerOpen(false);
              return;
            }
            animationFrame = window.requestAnimationFrame(() => void scan());
          } catch (reason) {
            setCheckInError(reason instanceof Error ? reason.message : "QR scanning failed.");
            setScannerOpen(false);
          }
        };
        void scan();
      } catch (reason) {
        setCheckInError(reason instanceof Error ? reason.message : "Camera access was denied.");
        setScannerOpen(false);
      }
    })();

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (!current || !audioRef.current) return;
    audioRef.current.src = current.preview ?? current.audioUrl ?? "";
    audioRef.current.currentTime = 0;
    setElapsed(0);
    setMediaDuration(current.duration ?? 30);
    audioRef.current.load();
  }, [current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    countedListenTrackId.current = null;
    listenPlaybackId.current = crypto.randomUUID();
  }, [current?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      void audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [playing, current]);

  function onSearchChange(value: string) {
    const parsed = searchSchema.safeParse({ query: value });
    if (!parsed.success) {
      setSearchError(zodErrorMessage(parsed.error));
      setQuery(value.slice(0, 100));
      return;
    }
    setSearchError("");
    setQuery(parsed.data.query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void searchTracks(parsed.data.query), 350);
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || heroAutoplayPaused || heroHovered || heroFocused) return;
    const timer = window.setInterval(() => {
      setHeroSlideIndex((index) => (index + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroAutoplayPaused, heroFocused, heroHovered]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (modal) {
        event.preventDefault();
        closeModal();
        return;
      }
      if (playerExpanded) {
        event.preventDefault();
        setPlayerExpanded(false);
        return;
      }
      if (searchOpen || searchLeaving) {
        event.preventDefault();
        closeSearchPanel();
        return;
      }
      if (!searchMinimized) {
        event.preventDefault();
        setSearchMinimized(true);
        return;
      }
      if (mobileNav) {
        event.preventDefault();
        setMobileNav(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, playerExpanded, searchOpen, searchLeaving, searchMinimized, mobileNav]);

  useEffect(() => {
    document.body.style.overflow = modal || mobileNav || playerExpanded || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal, mobileNav, playerExpanded, searchOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 851px)");
    const onChange = () => {
      if (media.matches) setMobileNav(false);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function dismissToast(id: string) {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );
    const existing = toastTimers.current.get(id);
    if (existing) window.clearTimeout(existing);
    const removeTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      toastTimers.current.delete(id);
    }, 260);
    toastTimers.current.set(id, removeTimer);
  }

  function showMessage(message: string, tone: "success" | "info" | "error" = "success") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    const timer = window.setTimeout(() => dismissToast(id), 3800);
    toastTimers.current.set(id, timer);
  }

  function recordPlaybackHistory() {
    if (!token || !current || historySavedPlaybackId.current === listenPlaybackId.current) return;
    let payload: ReturnType<typeof libraryTrackPayload>;
    try {
      payload = libraryTrackPayload(current);
    } catch {
      return;
    }

    const playbackId = listenPlaybackId.current;
    historySavedPlaybackId.current = playbackId;
    void request<LibraryEntry>("/library/history", token, {
      method: "POST",
      body: JSON.stringify({ ...payload, playbackId }),
    }).then((entry) => {
      setListeningHistory((old) => [libraryEntryToPlayerTrack(entry), ...old].slice(0, 50));
    }).catch((reason: unknown) => {
      historySavedPlaybackId.current = null;
      setLibraryError(reason instanceof Error
        ? reason.message
        : "Listening history could not be saved.");
    });
  }

  function requireListenerSession() {
    if (token) return true;
    setAuthMode("login");
    setModal("login");
    showMessage("Sign in to save music to your library.");
    return false;
  }

  async function toggleLikeTrack(track: Track) {
    if (!requireListenerSession() || libraryBusy) return;
    const key = libraryTrackKey(track);
    const separator = key.indexOf(":");
    const source = key.slice(0, separator);
    const sourceTrackId = key.slice(separator + 1);
    const isLiked = likedTrackKeys.includes(key);
    setLibraryBusy(true);
    setLibraryError("");
    try {
      if (isLiked) {
        await request<{ liked: boolean }>(
          `/library/likes/${source}/${encodeURIComponent(sourceTrackId)}`,
          token,
          { method: "DELETE" },
        );
        setLikedTrackKeys((old) => old.filter((item) => item !== key));
        setLikedTracks((old) => old.filter((item) => libraryTrackKey(item) !== key));
        showMessage("Removed from your liked songs.");
      } else {
        const payload = libraryTrackPayload(track, false);
        await request<{ liked: boolean }>("/library/likes", token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setLikedTrackKeys((old) => old.includes(key) ? old : [key, ...old]);
        setLikedTracks((old) => [track, ...old.filter((item) => libraryTrackKey(item) !== key)]);
        showMessage("Saved to your liked songs.");
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Your library could not be updated.";
      setLibraryError(message);
      showMessage(message);
    } finally {
      setLibraryBusy(false);
    }
  }

  function openPlaylistDialog(track: Track | null = null) {
    if (!requireListenerSession()) return;
    setPlaylistDialog({
      mode: track && playlists.length ? "add" : "create",
      track,
    });
    setPlaylistNameDraft("");
    setPlaylistDescriptionDraft("");
    setPlaylistChoiceId(playlists[0]?.id ?? "");
    setLibraryError("");
  }

  async function addTrackToPlaylist(playlistId: string, track: Track) {
    const result = await request<{ added: boolean }>(
      `/playlists/${encodeURIComponent(playlistId)}/tracks`,
      token,
      {
        method: "POST",
        body: JSON.stringify(libraryTrackPayload(track)),
      },
    );
    if (result.added) {
      await loadListenerLibrary();
      showMessage("Added to your playlist.");
    } else {
      showMessage("That track is already in this playlist.");
    }
  }

  async function submitPlaylistDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !playlistDialog || libraryBusy) return;
    setLibraryBusy(true);
    setLibraryError("");
    try {
      let destinationPlaylistId: string | null = null;
      if (playlistDialog.mode === "create") {
        const created = await request<Playlist>("/playlists", token, {
          method: "POST",
          body: JSON.stringify({
            name: playlistNameDraft,
            description: playlistDescriptionDraft || undefined,
          }),
        });
        setPlaylists((old) => [created, ...old]);
        destinationPlaylistId = created.id;
        if (playlistDialog.track) await addTrackToPlaylist(created.id, playlistDialog.track);
        else showMessage("Your playlist is ready.");
      } else if (playlistDialog.track && playlistChoiceId) {
        await addTrackToPlaylist(playlistChoiceId, playlistDialog.track);
        destinationPlaylistId = playlistChoiceId;
      }
      if (destinationPlaylistId) await showPlaylist(destinationPlaylistId);
      setPlaylistDialog(null);
      setPlaylistNameDraft("");
      setPlaylistDescriptionDraft("");
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "The playlist could not be updated.");
    } finally {
      setLibraryBusy(false);
    }
  }

  async function showPlaylist(playlistId: string) {
    if (!requireListenerSession()) return;
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const details = await request<PlaylistDetails>(
        `/playlists/${encodeURIComponent(playlistId)}`,
        token,
      );
      setPlaylistDetails(details);
      setLibraryTab("playlist");
      window.setTimeout(() => document.getElementById("library")?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "That playlist could not be opened.");
    } finally {
      setLibraryLoading(false);
    }
  }

  async function removePlaylistTrack(track: Track) {
    if (!token || !playlistDetails) return;
    const key = libraryTrackKey(track);
    const separator = key.indexOf(":");
    const source = key.slice(0, separator);
    const sourceTrackId = key.slice(separator + 1);
    setLibraryBusy(true);
    setLibraryError("");
    try {
      await request<{ removed: boolean }>(
        `/playlists/${encodeURIComponent(playlistDetails.id)}/tracks/${source}/${encodeURIComponent(sourceTrackId)}`,
        token,
        { method: "DELETE" },
      );
      await showPlaylist(playlistDetails.id);
      await loadListenerLibrary();
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "The track could not be removed.");
    } finally {
      setLibraryBusy(false);
    }
  }

  async function deleteCurrentPlaylist() {
    if (!token || !playlistDetails || !window.confirm(`Delete "${playlistDetails.name}"?`)) return;
    const playlistId = playlistDetails.id;
    setLibraryBusy(true);
    setLibraryError("");
    try {
      await request(`/playlists/${encodeURIComponent(playlistId)}`, token, { method: "DELETE" });
      setPlaylistDetails(null);
      setPlaylists((old) => old.filter((item) => item.id !== playlistId));
      setLibraryTab("recommendations");
      showMessage("Playlist deleted.");
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : "The playlist could not be deleted.");
    } finally {
      setLibraryBusy(false);
    }
  }

  function openLibraryTab(tab: "recommendations" | "liked" | "history") {
    if (!requireListenerSession()) return;
    setMobileNav(false);
    setLibraryTab(tab);
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
  }

  function recordQualifiedListen(audio: HTMLAudioElement) {
    if (
      audio.currentTime < 120
      || !token
      || !current
      || typeof current.id !== "string"
      || !current.audioUrl
      || current.preview
      || !listenPlaybackId.current
      || countedListenTrackId.current === current.id
    ) return;

    const trackId = current.id;
    countedListenTrackId.current = trackId;
    void request<{ counted: boolean }>(
      `/tracks/${encodeURIComponent(trackId)}/listens`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          playbackId: listenPlaybackId.current,
          city: listenCity || undefined,
        }),
      },
    ).then(({ counted }) => {
      showMessage(counted ? "Your 2-minute listen supports this artist." : "This track was already counted from your account today.");
    }).catch((reason: unknown) => {
      countedListenTrackId.current = null;
      showMessage(reason instanceof Error ? reason.message : "Your listen could not be counted.");
    });
  }

  function saveListenerCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const city = cityDraft.trim();
    if (!city) {
      localStorage.removeItem("wiloplay-listener-city");
      setListenCity("");
      setCityDraft("");
      showMessage("City sharing is off.");
      return;
    }
    localStorage.setItem("wiloplay-listener-city", city);
    setListenCity(city);
    setCityDraft(city);
    showMessage(`City sharing is on for ${city}.`);
  }

  async function stopCitySharing() {
    localStorage.removeItem("wiloplay-listener-city");
    setListenCity("");
    setCityDraft("");
    if (!token) {
      showMessage("City sharing is off.");
      return;
    }

    try {
      const result = await request<{ cleared: number }>(
        "/tracks/listens/location",
        token,
        { method: "DELETE" },
      );
      showMessage(`City sharing is off. Removed city labels from ${result.cleared} past listens.`);
    } catch (reason) {
      showMessage(reason instanceof Error
        ? `${reason.message} Future listens will not include your city.`
        : "Past city labels could not be removed. Future listens will not include your city.");
    }
  }

  function closeModal() {
    setModal(null);
    setError("");
    setFieldErrors({});
    setPurchaseResult(null);
    setAuthPasswordVisible(false);
    setResetPasswordVisible(false);
    if (modal === "email-verification") {
      setVerificationCode("");
      if (token && !user?.emailVerifiedAt) logout();
    }
    if (modal === "reset-password" || modal === "forgot-password") {
      setResetCode("");
      setResetPasswordDraft("");
    }
  }

  function closeSearchPanel() {
    if (!searchOpen && !searchLeaving) {
      setSearchMinimized(true);
      return;
    }
    setSearchOpen(false);
    setSearchLeaving(true);
    if (searchCloseTimer.current) clearTimeout(searchCloseTimer.current);
    searchCloseTimer.current = setTimeout(() => {
      setSearchLeaving(false);
      setSearchMinimized(true);
      searchCloseTimer.current = null;
    }, 260);
  }

  function toggleSearch() {
    if (searchMinimized) {
      setSearchMinimized(false);
      setSearchLeaving(false);
      setSearchOpen(true);
      requestAnimationFrame(() => document.getElementById("global-search")?.focus());
      return;
    }
    closeSearchPanel();
    setSearchMinimized(true);
  }

  function openSearch() {
    setSearchMinimized(false);
    setSearchLeaving(false);
    setSearchOpen(true);
    requestAnimationFrame(() => document.getElementById("global-search")?.focus());
  }

  function openSettings() {
    setMobileNav(false);
    if (!user) {
      setAuthMode("login");
      setModal("login");
      return;
    }
    setSettingsName(user.name);
    setFieldErrors({});
    setError("");
    setModal("settings");
  }

  function openProfile() {
    setMobileNav(false);
    if (!user) {
      setAuthMode("login");
      setModal("login");
      return;
    }
    if (user.role === "ARTIST") {
      window.location.assign(`/artist/${encodeURIComponent(user.id)}`);
      return;
    }
    openSettings();
  }

  function toggleTheme() {
    const nextTheme: WiloplayTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("wiloplay-theme", nextTheme);
  }

  function openEmailVerification(challenge: EmailVerificationChallenge, password?: string) {
    setVerificationEmail(challenge.email);
    setVerificationExpiresInSeconds(challenge.expiresInSeconds);
    setVerificationCode("");
    if (password) setVerificationPassword(password);
    setAuthDraft((draft) => ({
      ...draft,
      email: challenge.email,
      password: password || draft.password || verificationPassword,
    }));
    setModal("email-verification");
    showMessage(challenge.sent
      ? `A verification code was sent to ${challenge.email}.`
      : `Enter the code already sent to ${challenge.email}, or resend in a minute.`);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setBusy(true);
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const password = String(formData.password ?? "");
    const parsed = authMode === "signup"
      ? signupSchema.safeParse({
          name: String(formData.name ?? authDraft.name),
          email: String(formData.email ?? authDraft.email),
          password,
        })
      : loginSchema.safeParse({
          email: String(formData.email ?? authDraft.email),
          password,
        });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setError(zodErrorMessage(parsed.error));
      setBusy(false);
      return;
    }
    const payload = "name" in parsed.data
      ? {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        }
      : {
          email: parsed.data.email,
          password: parsed.data.password,
        };
    try {
      const result = await request<AuthResponse>(
        `/auth/${authMode}`,
        null,
        { method: "POST", body: JSON.stringify(payload) },
      );
      if ("verificationRequired" in result) {
        openEmailVerification(result, password);
        return;
      }
      establishSession(result, `You're in, ${result.user.name.split(" ")[0]}. Welcome to Wiloplay.`);
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.status === 401 && authMode === "login") {
        setError("That email and password don't match. Check your details or use Forgot password to reset it.");
      } else if (reason instanceof ApiRequestError && reason.status === 409 && authMode === "signup") {
        setError("An account with that email already exists. Log in or reset your password instead.");
      } else {
        setError(authErrorMessage(reason, "We couldn't complete sign in. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  function establishSession(session: AuthSession, message: string) {
    localStorage.setItem("sonora-token", session.accessToken);
    localStorage.setItem("sonora-user", JSON.stringify(session.user));
    setToken(session.accessToken);
    setUser(session.user);
    setAuthDraft({ name: "", email: "", password: "" });
    setVerificationPassword("");
    setVerificationCode("");
    setResetCode("");
    setResetPasswordDraft("");
    setModal(checkoutEvent ? "checkout" : null);
    showMessage(message);
  }

  async function resendEmailVerification() {
    const email = verificationEmail || authDraft.email;
    const password = verificationPassword || authDraft.password;

    if (token && (!email || !password)) {
      setBusy(true);
      setError("");
      try {
        const result = await request<EmailVerificationChallenge | EmailVerificationStatus | AuthSession>(
          "/auth/request-email-verification",
          token,
          { method: "POST" },
        );
        if ("verificationRequired" in result) {
          openEmailVerification(result);
        } else if ("accessToken" in result) {
          establishSession(result, "Your email is verified. Welcome to Wiloplay.");
        } else {
          if (user) {
            const verifiedUser = { ...user, emailVerifiedAt: result.emailVerifiedAt };
            localStorage.setItem("sonora-user", JSON.stringify(verifiedUser));
            setUser(verifiedUser);
          }
          setModal(null);
          showMessage("Your email is verified.");
        }
      } catch (reason) {
        setError(authErrorMessage(reason, "Could not resend the verification code."));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!email || !password) {
      setAuthMode("login");
      setAuthDraft({ name: "", email: verificationEmail || email, password: "" });
      setModal("login");
      setError("Enter your password once more so we can resend the verification code.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await request<AuthResponse>(
        "/auth/resend-email-verification",
        null,
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      if ("verificationRequired" in result) {
        openEmailVerification(result, password);
      } else {
        establishSession(result, "Your email is verified. Welcome to Wiloplay.");
      }
    } catch (reason) {
      setError(authErrorMessage(reason, "Could not resend the verification code."));
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    const parsed = verifyEmailSchema.safeParse({ email: verificationEmail, code: verificationCode });
    if (!parsed.success) {
      setError(zodErrorMessage(parsed.error));
      setBusy(false);
      return;
    }
    try {
      const result = await request<AuthSession>(
        "/auth/verify-email",
        null,
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      establishSession(result, "Your email is verified. Welcome to Wiloplay.");
    } catch (reason) {
      setError(authErrorMessage(reason, "Could not verify your email."));
    } finally {
      setBusy(false);
    }
  }

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    const parsed = forgotPasswordSchema.safeParse({ email: authDraft.email });
    if (!parsed.success) {
      setFieldErrors({ email: zodErrorMessage(parsed.error) });
      setError(zodErrorMessage(parsed.error));
      setBusy(false);
      return;
    }
    try {
      const result = await request<PasswordResetChallenge>(
        "/auth/forgot-password",
        null,
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      setVerificationEmail(result.email);
      setResetExpiresInSeconds(result.expiresInSeconds ?? 600);
      setResetCode("");
      setResetPasswordDraft("");
      setModal("reset-password");
      showMessage(result.message);
    } catch (reason) {
      setError(authErrorMessage(reason, "Could not start password reset."));
    } finally {
      setBusy(false);
    }
  }

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
    const parsed = resetPasswordSchema.safeParse({
      email: verificationEmail,
      code: resetCode,
      password: resetPasswordDraft,
    });
    if (!parsed.success) {
      setError(zodErrorMessage(parsed.error));
      setBusy(false);
      return;
    }
    try {
      const result = await request<AuthSession>(
        "/auth/reset-password",
        null,
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      establishSession(result, "Password updated. You're signed in.");
    } catch (reason) {
      setError(authErrorMessage(reason, "Could not reset your password."));
    } finally {
      setBusy(false);
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const parsed = settingsSchema.safeParse({ name: settingsName, city: cityDraft });
    if (!parsed.success) {
      setError(zodErrorMessage(parsed.error));
      return;
    }
    if (user) {
      const nextUser = { ...user, name: parsed.data.name };
      localStorage.setItem("sonora-user", JSON.stringify(nextUser));
      setUser(nextUser);
    }
    setCityDraft(parsed.data.city);
    if (parsed.data.city.trim()) {
      localStorage.setItem("wiloplay-listener-city", parsed.data.city.trim());
      setListenCity(parsed.data.city.trim());
    } else {
      localStorage.removeItem("wiloplay-listener-city");
      setListenCity("");
    }
    showMessage("Your profile settings were updated on this device.");
    setModal(null);
  }

  function logout() {
    localStorage.removeItem("sonora-token");
    localStorage.removeItem("sonora-user");
    setToken(null);
    setUser(null);
    setAiConfiguration(null);
    setTrackSuggestions({});
    setMyTicketOrders([]);
    setArtistEvents([]);
    setArtistBankAccount(null);
    setArtistVerified(false);
    setArtistTracks([]);
    setLikedTracks([]);
    setLikedTrackKeys([]);
    setPlaylists([]);
    setPlaylistDetails(null);
    setListeningHistory([]);
    setRecommendations([]);
    setCurrent(null);
    setQueue([]);
    setPlaying(false);
    setQueueOpen(false);
    setLibraryTab("recommendations");
    historySavedPlaybackId.current = null;
    countedListenTrackId.current = null;
    setNotificationOpen(false);
    showMessage("You've signed out.");
  }

  async function becomeArtist() {
    setBusy(true);
    setError("");
    try {
      const result = await request<AuthSession>(
        "/auth/become-artist",
        token,
        { method: "POST" },
      );
      establishSession(result, "Your artist profile is ready. Let's make something.");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not update your account.";
      setError(message);
      showMessage(message);
    } finally {
      setBusy(false);
    }
  }

  function openUploadWizard() {
    setUploadStep(0);
    setUploadReleaseType("SINGLE");
    setUploadDraft({
      artistName: user?.name ?? "",
      title: "",
      albumTitle: "",
      genre: "Afrobeats",
      releaseDescription: "",
    });
    setUploadFiles([]);
    setUploadCoverFile(null);
    setError("");
    setModal("upload");
  }

  function openEventWizard() {
    setEventStep(0);
    setEventDraft({ title: "", venue: "", city: "", startsAt: "" });
    setTicketCategoryDrafts([{ name: "Regular", price: "5000", capacity: "100" }]);
    setEventCoverFile(null);
    setError("");
    setModal("event");
  }

  function advanceUploadStep() {
    if (uploadStep === 0 && !uploadFormRef.current?.reportValidity()) return;
    if (uploadStep === 1 && (!uploadFiles.length || !uploadCoverFile)) {
      setError("Choose at least one audio file and add cover artwork to continue.");
      return;
    }
    setError("");
    setUploadStep((step) => Math.min(step + 1, 2));
  }

  function advanceEventStep() {
    if (!eventFormRef.current?.reportValidity()) return;
    setError("");
    setEventStep((step) => Math.min(step + 1, 2));
  }

  async function uploadTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadStep !== 2) return;
    if (!uploadFiles.length || !uploadCoverFile) {
      setUploadStep(1);
      setError("Add your audio and cover artwork before publishing.");
      return;
    }
    setBusy(true);
    setError("");
    const data = new FormData();
    data.set("artistName", uploadDraft.artistName.trim());
    data.set("releaseType", uploadReleaseType);
    data.set("genre", uploadDraft.genre);
    data.set("releaseDescription", uploadDraft.releaseDescription.trim());
    if (uploadReleaseType === "SINGLE") {
      data.set("title", uploadDraft.title.trim());
    } else {
      data.set("albumTitle", uploadDraft.albumTitle.trim());
    }
    uploadFiles.forEach((file) => data.append("files", file));
    data.set("cover", uploadCoverFile);
    try {
      const created = await request<
        { id: string; title: string; artistName: string; audioUrl: string; coverUrl?: string; genre: string; releaseType: "SINGLE" | "ALBUM"; albumTitle?: string | null; releaseDescription?: string | null; duration?: number }[]
      >(
        "/tracks/upload",
        token,
        { method: "POST", body: data },
      );
      const additions = created.map((track) => ({
        ...track,
        artist: track.artistName,
        cover: track.coverUrl ? `${API}${track.coverUrl}` : "",
        audioUrl: `${API}${track.audioUrl}`,
        releaseDescription: track.releaseDescription,
      }));
      setUploadedTracks((old) => [...additions, ...old]);
      setArtistTracks((old) => [...additions, ...old]);
      setUploadReleaseType("SINGLE");
      setUploadStep(0);
      setUploadDraft({ artistName: user?.name ?? "", title: "", albumTitle: "", genre: "Afrobeats", releaseDescription: "" });
      setUploadFiles([]);
      setUploadCoverFile(null);
      setModal(null);
      showMessage(created[0]?.releaseType === "ALBUM" ? "Your album is out in the world." : "Your single is out in the world.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function getTrackShareUrl(track: Track) {
    return `${window.location.origin}/?track=${encodeURIComponent(track.id)}`;
  }

  function shareTrack(track: Track, platform: "WhatsApp" | "Facebook" | "X") {
    const url = getTrackShareUrl(track);
    const text = `Listen to ${track.title} by ${track.artist} on Wiloplay`;
    const shareUrl = platform === "WhatsApp"
      ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
      : platform === "Facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  async function shareEvent(event: EventItem, platform: "TikTok" | "WhatsApp" | "Instagram" | "X") {
    const url = `${window.location.origin}/?event=${encodeURIComponent(event.id)}#shows`;
    const text = `Join ${user?.name ?? event.artistName} at ${event.title} in ${event.city}. Get tickets on Wiloplay.`;
    const shareUrl = platform === "WhatsApp"
      ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
      : platform === "X"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        : null;
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
        return;
      } catch (reason) {
        if (reason instanceof Error && reason.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      showMessage(`Event link copied. Paste it into ${platform}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The event link could not be copied.");
    }
  }

  async function copyTrackLink(track: Track) {
    try {
      await navigator.clipboard.writeText(getTrackShareUrl(track));
      showMessage("Track link copied.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The track link could not be copied.");
    }
  }

  async function updateArtistTrack(event: FormEvent<HTMLFormElement>, track: Track) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const updated = await request<Track & { artistName: string; coverUrl?: string | null }>(
        `/tracks/${track.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: values.get("title"),
            genre: values.get("genre"),
            ...(values.has("albumTitle") && { albumTitle: values.get("albumTitle") }),
            releaseDescription: values.get("releaseDescription"),
          }),
        },
      );
      setArtistTracks((old) => old.map((item) => item.id === track.id ? {
        ...item,
        title: updated.title,
        genre: updated.genre,
        albumTitle: updated.albumTitle,
        releaseDescription: updated.releaseDescription,
      } : item));
      setUploadedTracks((old) => old.map((item) => item.id === track.id ? {
        ...item,
        title: updated.title,
        genre: updated.genre,
        albumTitle: updated.albumTitle,
        releaseDescription: updated.releaseDescription,
      } : item));
      setEditingTrackId(null);
      showMessage("Track details updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Track details could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function suggestTrackMetadata(track: Track) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const suggestions = await request<ReleaseSuggestions>(
        `/tracks/${encodeURIComponent(String(track.id))}/ai/suggest`,
        token,
        { method: "POST" },
      );
      setTrackSuggestions((old) => ({ ...old, [String(track.id)]: suggestions }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI suggestions could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  async function applyTrackSuggestions(track: Track, suggestions: ReleaseSuggestions) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const updated = await request<Track>(
        `/tracks/${encodeURIComponent(String(track.id))}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(suggestions),
        },
      );
      const update = (item: Track) => item.id === track.id ? {
        ...item,
        title: updated.title,
        genre: updated.genre,
        releaseDescription: updated.releaseDescription,
      } : item;
      setArtistTracks((old) => old.map(update));
      setUploadedTracks((old) => old.map(update));
      setTrackSuggestions((old) => {
        const next = { ...old };
        delete next[String(track.id)];
        return next;
      });
      showMessage("AI suggestions applied. You can edit these details any time.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI suggestions could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function generateTrackCover(track: Track) {
    if (!token || !window.confirm(`Generate new cover art for "${track.albumTitle ?? track.title}" and replace its current cover?`)) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<{ coverUrl: string }>(
        `/tracks/${encodeURIComponent(String(track.id))}/ai/cover`,
        token,
        { method: "POST" },
      );
      const cover = `${API}${result.coverUrl}`;
      const isAlbum = track.releaseType === "ALBUM";
      const matchesRelease = (item: Track) => item.id === track.id
        || (isAlbum
          && item.releaseType === "ALBUM"
          && item.albumTitle === track.albumTitle
          && item.artist === track.artist
          && item.cover === track.cover);
      setArtistTracks((old) => old.map((item) => matchesRelease(item) ? { ...item, cover } : item));
      setUploadedTracks((old) => old.map((item) => matchesRelease(item) ? { ...item, cover } : item));
      setCurrent((item) => item && matchesRelease(item) ? { ...item, cover } : item);
      showMessage("New cover art generated and saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cover art could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  async function startAudioEnhancement(track: Track) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<{ status: string }>(
        `/tracks/${encodeURIComponent(String(track.id))}/enhancement`,
        token,
        { method: "POST" },
      );
      setArtistTracks((old) => old.map((item) => item.id === track.id
        ? { ...item, aiProductionStatus: result.status }
        : item));
      showMessage(result.status === "Done" ? "Enhanced audio is ready to preview." : "Audio enhancement has started.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audio enhancement could not be started.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteArtistTrack(track: Track) {
    if (!token || !window.confirm(`Delete "${track.title}" from your music library?`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/tracks/${track.id}`, token, { method: "DELETE" });
      setArtistTracks((old) => old.filter((item) => item.id !== track.id));
      setUploadedTracks((old) => old.filter((item) => item.id !== track.id));
      if (current?.id === track.id) {
        setCurrent(null);
        setPlaying(false);
      }
      showMessage("Track deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Track could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function addEventCapacity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !activeSalesEvent) return;
    setBusy(true);
    setError("");
    try {
      await request(`/events/${activeSalesEvent.id}/capacity`, token, {
        method: "PATCH",
        body: JSON.stringify({ additionalTickets }),
      });
      await Promise.all([loadArtistEvents(), loadEvents()]);
      showMessage(`${additionalTickets} more tickets added.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "More tickets could not be added.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEventNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !activeSalesEvent) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<{ recipientCount: number; sentCount: number; failedCount: number }>(
        `/events/${activeSalesEvent.id}/notify`,
        token,
        { method: "POST", body: JSON.stringify({ message: notificationMessage }) },
      );
      setNotificationMessage("");
      setNotificationOpen(false);
      showMessage(`Sent to ${result.sentCount} of ${result.recipientCount} ticket holders${result.failedCount ? `; ${result.failedCount} failed` : ""}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Attendee notification could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (eventStep !== 2) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("title", eventDraft.title.trim());
    body.set("artistName", user?.name ?? "");
    body.set("venue", eventDraft.venue.trim());
    body.set("city", eventDraft.city.trim());
    body.set("startsAt", new Date(eventDraft.startsAt).toISOString());
    const categories = ticketCategoryDrafts.map((category) => ({
      name: category.name.trim(),
      priceCents: Math.round(Number(category.price) * 100),
      capacity: Number(category.capacity),
    }));
    body.set("priceCents", String(categories[0]?.priceCents ?? 0));
    body.set("capacity", String(categories.reduce((total, category) => total + category.capacity, 0)));
    body.set("ticketCategories", JSON.stringify(categories));
    if (eventCoverFile) body.set("cover", eventCoverFile);
    try {
      await request("/events", token, {
        method: "POST",
        body,
      });
      setModal(null);
      setEventStep(0);
      setEventDraft({ title: "", venue: "", city: "", startsAt: "" });
      setEventCoverFile(null);
      setTicketCategoryDrafts([{ name: "Regular", price: "5000", capacity: "100" }]);
      await loadEvents();
      await loadArtistEvents();
      showMessage("Showtime. Your event is now live.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish event.");
    } finally {
      setBusy(false);
    }
  }

  function reserveTicket(eventItem: EventItem) {
    if (!token) {
      setCheckoutEvent(eventItem);
      setAuthMode("signup");
      setModal("signup");
      return;
    }
    setCheckoutEvent(eventItem);
    setPurchaseResult(null);
    setTicketQuantity(1);
    setSelectedTicketCategoryId(
      eventItem.ticketCategories.find((category) => category.name.toLowerCase() === "regular")?.id
      ?? eventItem.ticketCategories[0]?.id
      ?? "",
    );
    setModal("checkout");
  }

  async function purchaseTickets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !checkoutEvent) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<PurchaseResult>(
        `/events/${checkoutEvent.id}/tickets`,
        token,
        {
        method: "POST",
        body: JSON.stringify({
          quantity: ticketQuantity,
          ...(selectedTicketCategoryId && { categoryId: selectedTicketCategoryId }),
        }),
        },
      );
      setPurchaseResult(result);
      setModal("purchase-result");
      await Promise.all([loadEvents(), loadMyTicketOrders(), loadArtistEvents()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ticket purchase failed.");
    } finally {
      setBusy(false);
    }
  }

  async function checkInTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedSalesEventId || !ticketCode.trim()) return;
    setBusy(true);
    setCheckInError("");
    setCheckInMessage("");
    try {
      const result = await request<{ attendee: string; event: string }>(
        `/events/${selectedSalesEventId}/check-in`,
        token,
        { method: "POST", body: JSON.stringify({ code: ticketCode.trim() }) },
      );
      setTicketCode("");
      setCheckInMessage(`${result.attendee} checked in for ${result.event}.`);
      await loadArtistEvents();
    } catch (reason) {
      setCheckInError(reason instanceof Error ? reason.message : "Ticket check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  function toggleTrack(track: Track, nextQueue: Track[] = shownTracks) {
    if (!track.preview && !track.audioUrl) {
      showMessage("This track is not playable right now.");
      return;
    }
    const playableQueue = nextQueue.filter((item) => item.preview || item.audioUrl);
    setQueue(playableQueue.length ? playableQueue : [track]);
    if (current?.id === track.id && current.audioUrl === track.audioUrl) {
      setPlaying((isPlaying) => !isPlaying);
      return;
    }
    setCurrent(track);
    setPlaying(true);
    setQueueOpen(false);
  }

  function stepQueue(direction: -1 | 1, ended = false) {
    const candidates = (queue.length ? queue : shownTracks)
      .filter((track) => track.preview || track.audioUrl);
    if (!candidates.length) {
      setPlaying(false);
      return;
    }

    if (direction < 0 && !ended && audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setElapsed(0);
      return;
    }

    const currentIndex = candidates.findIndex((track) => track.id === current?.id);
    let nextTrack: Track;
    if (shuffle && candidates.length > 1) {
      const alternatives = candidates.filter((track) => track.id !== current?.id);
      nextTrack = alternatives[Math.floor(Math.random() * alternatives.length)];
    } else {
      const nextIndex = currentIndex + direction;
      if (ended && repeatMode === "off" && (nextIndex < 0 || nextIndex >= candidates.length)) {
        setPlaying(false);
        return;
      }
      nextTrack = candidates[(nextIndex + candidates.length) % candidates.length];
    }

    if (nextTrack.id === current?.id) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setElapsed(0);
      setPlaying(true);
      return;
    }
    setCurrent(nextTrack);
    setPlaying(true);
  }

  const wiloplaySearchTracks = useMemo(
    () => (searchResults?.tracks ?? []).map((track) => apiTrackToPlayerTrack(track)),
    [searchResults],
  );
  const shownTracks = useMemo(() => {
    if (!query.trim() || (!searchResults && !activeCatalogGenre)) return [...uploadedTracks, ...tracks];
    if (searchFilter === "catalog") return tracks;
    if (searchFilter === "wiloplay") return wiloplaySearchTracks;
    if (searchFilter === "artists" || searchFilter === "shows") return [];
    return [...wiloplaySearchTracks, ...tracks];
  }, [query, searchResults, searchFilter, uploadedTracks, tracks, wiloplaySearchTracks, activeCatalogGenre]);
  const activeLibraryTracks = libraryTab === "liked"
    ? likedTracks
    : libraryTab === "history"
      ? listeningHistory
      : libraryTab === "playlist"
        ? (playlistDetails?.tracks ?? []).map(libraryEntryToPlayerTrack)
        : recommendations;
  const uploadedAlbums = useMemo(() => {
    const albums = new Map<string, {
      id: string;
      title: string;
      artist: string;
      cover: string;
      trackCount: number;
      description: string | null;
    }>();
    for (const track of uploadedTracks) {
      if (track.releaseType !== "ALBUM" || !track.albumTitle) continue;
      const key = `${track.artistProfileId ?? track.artist}:${track.albumTitle}`;
      const currentAlbum = albums.get(key);
      if (currentAlbum) {
        currentAlbum.trackCount += 1;
      } else {
        albums.set(key, {
          id: String(track.id),
          title: track.albumTitle,
          artist: track.artist,
          cover: track.cover,
          trackCount: 1,
          description: track.releaseDescription ?? null,
        });
      }
    }
    return [...albums.values()];
  }, [uploadedTracks]);
  const upcomingEvents = events.filter((item) => new Date(item.startsAt).getTime() > now);
  const activeTicketOrders = myTicketOrders.filter(
    (order) => new Date(order.event.startsAt).getTime() > now,
  );
  const activeSalesEvent =
    artistEvents.find((item) => item.id === selectedSalesEventId) ?? artistEvents[0];
  const selectedCheckoutCategory = checkoutEvent?.ticketCategories.find(
    (category) => category.id === selectedTicketCategoryId,
  ) ?? checkoutEvent?.ticketCategories[0];

  return (
    <main className="app-shell">
      <button
        type="button"
        className={`sidebar-scrim${mobileNav ? " is-visible" : ""}`}
        aria-label="Close menu"
        tabIndex={mobileNav ? 0 : -1}
        onClick={() => setMobileNav(false)}
      />
      <aside
        className={`sidebar${mobileNav ? " is-open" : ""}`}
        aria-label="Primary navigation"
        data-open={mobileNav ? "true" : "false"}
      >
        <div className="sidebar-aura" aria-hidden="true" />
        <header className="sidebar-header">
          <a href="#home" className="brand" aria-label="Wiloplay home" onClick={() => setMobileNav(false)}>
            <span className="brand-mark"><AudioLines size={18} strokeWidth={2.25} /></span>
            <span className="brand-copy">
              <strong>wiloplay<span className="brand-dot">.</span></strong>
              <small>Listen in</small>
            </span>
          </a>
          <button className="sidebar-close" type="button" aria-label="Close menu" onClick={() => setMobileNav(false)}>
            <X size={17} />
          </button>
        </header>

        <button type="button" className="sidebar-identity" onClick={openProfile}>
          <span className="sidebar-avatar" aria-hidden="true">
            {user?.name?.trim() ? user.name.trim().charAt(0).toUpperCase() : <UserRound size={16} />}
          </span>
          <span className="sidebar-identity-copy">
            <strong>{user ? user.name : "Welcome in"}</strong>
            <small>{user ? (user.role === "ARTIST" ? "Artist account" : "Listener account") : "Sign in to sync your sound"}</small>
          </span>
          <span className="sidebar-identity-action" aria-hidden="true"><ArrowRight size={14} /></span>
        </button>

        <div className="sidebar-scroll">
          <section className="sidebar-section">
            <p className="nav-caption">Explore</p>
            <nav className="side-nav" aria-label="Main navigation">
              <a className={`nav-link ${activeNav === "home" ? "active" : ""}`} aria-current={activeNav === "home" ? "location" : undefined} href="#home" onClick={() => setMobileNav(false)}>
                <span className="nav-ico"><Home size={16} /></span>
                <span className="nav-label">Home</span>
              </a>
              <a
                className={`nav-link ${activeNav === "discovery" ? "active" : ""}`}
                aria-current={activeNav === "discovery" ? "location" : undefined}
                href="/sound"
                onClick={() => setMobileNav(false)}
              >
                <span className="nav-ico"><Compass size={16} /></span>
                <span className="nav-label">Discover</span>
              </a>
              <a className={`nav-link ${activeNav === "for-you" ? "active" : ""}`} aria-current={activeNav === "for-you" ? "location" : undefined} href="#library" onClick={() => setMobileNav(false)}>
                <span className="nav-ico"><Heart size={16} /></span>
                <span className="nav-label">Made for you</span>
              </a>
              <a className={`nav-link ${activeNav === "shows" ? "active" : ""}`} aria-current={activeNav === "shows" ? "location" : undefined} href="#shows" onClick={() => setMobileNav(false)}>
                <span className="nav-ico"><Ticket size={16} /></span>
                <span className="nav-label">Live shows</span>
              </a>
              <a className="nav-link" href="/tickets" onClick={() => setMobileNav(false)}>
                <span className="nav-ico"><QrCode size={16} /></span>
                <span className="nav-label">Tickets</span>
                <span className="nav-new">NEW</span>
              </a>
              <a className={`nav-link ${activeNav === "my-tickets" ? "active" : ""}`} aria-current={activeNav === "my-tickets" ? "location" : undefined} href="#my-tickets" onClick={() => setMobileNav(false)}>
                <span className="nav-ico"><BadgeCheck size={16} /></span>
                <span className="nav-label">My tickets</span>
              </a>
            </nav>
          </section>

          <section className="sidebar-section">
            <p className="nav-caption">Your library</p>
            <div className="sidebar-stack">
              <button type="button" className="library-link" onClick={() => { setMobileNav(false); openPlaylistDialog(); }}>
                <span className="nav-ico"><Plus size={15} /></span>
                <span>Create a playlist</span>
              </button>
              <button type="button" className="library-link" onClick={() => openLibraryTab("liked")}>
                <span className="nav-ico"><Heart size={15} /></span>
                <span>Liked songs</span>
              </button>
              <button type="button" className="library-link" onClick={() => openLibraryTab("history")}>
                <span className="nav-ico"><Clock3 size={15} /></span>
                <span>Listening history</span>
              </button>
            </div>
            <div className="sidebar-playlists" aria-label="Your playlists">
              {playlists.slice(0, 6).map((playlist) => (
                <button
                  type="button"
                  className="sidebar-playlist-link"
                  key={playlist.id}
                  onClick={() => {
                    setMobileNav(false);
                    void showPlaylist(playlist.id);
                  }}
                >
                  <span className="nav-ico"><ListMusic size={14} /></span>
                  <span>{playlist.name}</span>
                </button>
              ))}
              {!playlists.length && (
                <div className="playlist-empty">
                  Keep the good stuff close.
                  <br />
                  Your playlists will live here.
                </div>
              )}
            </div>
          </section>

          <section className="sidebar-section">
            <p className="nav-caption">Account</p>
            <div className="sidebar-stack">
              <button type="button" className="library-link" onClick={openProfile}>
                <span className="nav-ico"><UserRound size={15} /></span>
                <span>{user ? "My profile" : "Sign in"}</span>
              </button>
              <button type="button" className="library-link" onClick={openSettings}>
                <span className="nav-ico"><Settings size={15} /></span>
                <span>Settings</span>
              </button>
            </div>
          </section>
        </div>

        <footer className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-icon"><Mic2 size={16} /></div>
            <div>
              <strong>{user?.role === "ARTIST" ? "Share a release" : "Made something?"}</strong>
              <span>{user?.role === "ARTIST" ? "Upload and find your people." : "Your listeners are out there."}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-artist"
            onClick={() => {
              if (user?.role === "ARTIST") {
                setMobileNav(false);
                openUploadWizard();
                return;
              }
              if (user) {
                setMobileNav(false);
                void becomeArtist();
                return;
              }
              setAuthMode("signup");
              setModal("signup");
              setMobileNav(false);
            }}
          >
            <span>{user?.role === "ARTIST" ? "Upload music" : "Start as an artist"}</span>
            <ArrowRight size={14} />
          </button>
          <p className="sidebar-footer">A little more music. A lot more you.</p>
        </footer>
      </aside>

      <section className="main-panel" id="home">
        <header className={`topbar${!searchMinimized ? " is-search-focus" : ""}`}>
          <div className="topbar-left">
            <button className="icon-btn mobile-menu topbar-chrome" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button>
            <button className="icon-btn top-arrow topbar-chrome" aria-label="Go back" onClick={() => window.history.back()}><ArrowLeft size={17} /></button>
            <button className="icon-btn top-arrow topbar-chrome" aria-label="Go forward" onClick={() => window.history.forward()}><ArrowRight size={17} /></button>
            <div className={`search-shell${searchOpen || searchLeaving ? " is-expanded" : ""}${searchMinimized ? " is-minimized" : ""}`}>
              {(searchOpen || searchLeaving) && (
                <button
                  type="button"
                  className={`search-scrim${searchLeaving ? " is-leaving" : " is-visible"}`}
                  aria-label="Close search"
                  tabIndex={searchOpen ? 0 : -1}
                  onClick={closeSearchPanel}
                />
              )}
              <form
                className={`search-box${searchOpen ? " search-focused" : ""}${searchMinimized ? " search-minimized" : ""}`}
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearchLeaving(false);
                  setSearchOpen(true);
                  void searchTracks(query);
                  document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <button type="button" className="search-toggle" aria-label={searchMinimized ? "Expand search" : "Minimize search"} aria-expanded={!searchMinimized} aria-controls={searchMinimized ? undefined : "global-search"} onClick={toggleSearch}><Search size={16} /></button>
                {!searchMinimized && (
                  <input
                    id="global-search"
                    aria-label="Search songs, artists, albums, and shows"
                    placeholder="Songs, artists, albums, shows..."
                    value={query}
                    onFocus={() => {
                      setSearchLeaving(false);
                      setSearchOpen(true);
                    }}
                    onChange={(event) => onSearchChange(event.target.value)}
                  />
                )}
                {!searchMinimized && (searchLoading
                  ? <span className="search-loading" aria-live="polite">Searching</span>
                  : query
                    ? <button className="search-clear" type="button" aria-label="Clear search" onClick={() => { setQuery(""); void searchTracks(""); }}><X size={14} /></button>
                    : <button className="search-clear" type="button" aria-label="Close search" onClick={closeSearchPanel}><X size={14} /></button>)}
              </form>
              {(searchOpen || searchLeaving) && (query.trim() || searchResults) && (
              <div
                className={`search-panel${searchLeaving ? " is-leaving" : " is-open"}`}
                role="listbox"
                aria-label="Search results"
                aria-hidden={searchLeaving}
              >
                <div className="search-panel-head">
                  <strong>Search</strong>
                  <button type="button" className="search-panel-close" aria-label="Close search" onMouseDown={(event) => event.preventDefault()} onClick={closeSearchPanel}><X size={15} /></button>
                </div>
                <div className="search-filter-row">
                  {([
                    ["all", "All", searchResults?.totals.all ?? 0],
                    ["wiloplay", "Wiloplay", searchResults?.totals.tracks ?? 0],
                    ["catalog", "Catalog", searchResults?.totals.catalogTracks ?? tracks.length],
                    ["artists", "Artists", searchResults?.totals.artists ?? 0],
                    ["shows", "Shows", searchResults?.totals.events ?? 0],
                  ] as const).map(([id, label, count]) => (
                    <button key={id} type="button" className={`search-filter${searchFilter === id ? " is-active" : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={() => setSearchFilter(id)}>
                      {label}{query.trim() ? ` · ${count}` : ""}
                    </button>
                  ))}
                </div>
                {searchLoading && <p className="search-panel-empty">Looking across Wiloplay and free catalogs…</p>}
                {!searchLoading && searchError && <p className="search-panel-empty">{searchError}</p>}
                {!searchLoading && !searchError && query.trim() && !searchResults?.totals.all && <p className="search-panel-empty">No matches yet. Try another song, artist, mood, or city.</p>}
                {!searchLoading && searchResults && (searchFilter === "all" || searchFilter === "wiloplay") && searchResults.tracks.slice(0, 5).map((track) => {
                  const playable = apiTrackToPlayerTrack(track);
                  return <button type="button" className="search-hit" key={`upload-${track.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { toggleTrack(playable); closeSearchPanel(); }}>
                    <Cover src={playable.cover} alt="" /><span><strong>{track.title}</strong><small>{track.artistName} · Wiloplay{track.genre ? ` · ${track.genre}` : ""}</small></span><Play size={13} />
                  </button>;
                })}
                {!searchLoading && (searchFilter === "all" || searchFilter === "catalog") && (searchResults?.catalogTracks ?? []).slice(0, 5).map((track) => {
                  const playable = catalogTrackToPlayerTrack(track);
                  return <button type="button" className="search-hit" key={`catalog-${track.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { toggleTrack(playable); closeSearchPanel(); }}>
                    <Cover src={playable.cover} alt="" /><span><strong>{track.title}</strong><small>{track.artist} · {catalogProviderLabel(track.provider)} · {track.playback === "full" ? "Full" : "Preview"}</small></span><Play size={13} />
                  </button>;
                })}
                {!searchLoading && searchResults && (searchFilter === "all" || searchFilter === "artists") && searchResults.artists.slice(0, 5).map((artist) => (
                  <a className="search-hit" key={`artist-${artist.id}`} href={`/artist/${encodeURIComponent(artist.id)}`} onMouseDown={(event) => event.preventDefault()}>
                    <Cover src={artist.coverUrl ? `${API}${artist.coverUrl}` : ""} alt="" /><span><strong>{artist.name}</strong><small>{artist.trackCount} release{artist.trackCount === 1 ? "" : "s"} · {artist.followers} follower{artist.followers === 1 ? "" : "s"}</small></span><Users size={13} />
                  </a>
                ))}
                {!searchLoading && searchResults && (searchFilter === "all" || searchFilter === "shows") && searchResults.events.slice(0, 5).map((eventItem) => (
                  <button type="button" className="search-hit" key={`event-${eventItem.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { closeSearchPanel(); document.getElementById(`event-${eventItem.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>
                    <Cover src={eventItem.coverUrl ? `${API}${eventItem.coverUrl}` : ""} alt="" /><span><strong>{eventItem.title}</strong><small>{eventItem.artistName} · {eventItem.city} · {formatDate(eventItem.startsAt)}</small></span><Ticket size={13} />
                  </button>
                ))}
                {query.trim() && <button type="button" className="search-panel-footer" onMouseDown={(event) => event.preventDefault()} onClick={() => { void searchTracks(query); document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" }); closeSearchPanel(); }}>See full results <ArrowRight size={14} /></button>}
              </div>
              )}
            </div>
          </div>
          <div className="topbar-actions topbar-chrome" aria-hidden={!searchMinimized || undefined}>
            <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "light"} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
            {user ? (
              <div className="account-wrap">
                {user.role === "ARTIST" && <details className="artist-studio-menu">
                  <summary className="artist-studio-trigger">
                    <span className="artist-studio-icon"><AudioLines size={16} /></span>
                    <span className="artist-studio-copy"><strong>Artist studio</strong><small>Manage your music</small></span>
                    <ChevronDown className="artist-studio-chevron" size={14} />
                  </summary>
                  <div className="artist-studio-dropdown">
                    <a href={`/artist/${encodeURIComponent(user.id)}`} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>
                      <Users size={16} /><span><strong>Profile &amp; audience</strong><small>Fans, listens, and cities</small></span><ArrowRight size={14} />
                    </a>
                    <button onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); document.getElementById("ticket-sales")?.scrollIntoView({ behavior: "smooth" }); }}>
                      <ScanLine size={16} /><span><strong>Ticket sales</strong><small>Bookings and check-in</small></span><ArrowRight size={14} />
                    </button>
                    <button onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); openUploadWizard(); }}>
                      <Upload size={16} /><span><strong>Upload release</strong><small>Share a new track</small></span><ArrowRight size={14} />
                    </button>
                  </div>
                </details>}
                <div className="account-chip"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span className="account-name">{user.name.split(" ")[0]}</span></div>
                <button className="icon-btn logout-btn" aria-label="Sign out" onClick={logout}><LogOut size={16} /></button>
              </div>
            ) : (
              <><button className="login-btn" onClick={() => { setAuthMode("login"); setModal("login"); }}>Log in</button><button className="signup-btn" onClick={() => { setAuthMode("signup"); setModal("signup"); }}>Sign up free <ArrowRight size={14} /></button></>
            )}
          </div>
        </header>

        <div className="page-content">
          <section className="hero">
            <div className="hero-grain" />
            <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> A DIFFERENT KIND OF MUSIC APP</div>
              <h1>Music finds<br />its <span>people.</span></h1>
              <p>Less scrolling, more feeling. Discover your next favorite, get closer to the artists, and meet us at the show.</p>
              <div className="hero-actions"><a className="hero-cta" href="/sound">Find your sound <ArrowRight size={16} /></a><button className="hero-secondary" onClick={() => { setAuthMode("signup"); setModal("signup"); }}>I&apos;m an artist <ArrowDownToLine size={15} /></button></div>
              <div className="hero-proof"><span className="proof-avatars"><i>J</i><i>M</i><i>A</i><i>+</i></span><span>Good music. Good people. <strong>That&apos;s it.</strong></span></div>
            </div>
            <div className="hero-art">
              <div
                className="hero-swiper"
                role="region"
                aria-roledescription="carousel"
                aria-label="Featured artists, live music, and podcasts"
                onMouseEnter={() => setHeroHovered(true)}
                onMouseLeave={(event) => {
                  setHeroHovered(false);
                  if (!event.currentTarget.contains(document.activeElement)) {
                    setHeroFocused(false);
                  }
                }}
                onFocusCapture={() => setHeroFocused(true)}
                onBlurCapture={(event) => {
                  const nextTarget = event.relatedTarget;
                  if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                    setHeroFocused(false);
                  }
                }}
              >
                <div className="hero-slide-stack" aria-live="off">
                  {heroSlides.map((slide, index) => {
                    const distance = (index - heroSlideIndex + heroSlides.length) % heroSlides.length;
                    const position = distance === 0
                      ? "current"
                      : distance === 1
                        ? "next"
                        : distance === heroSlides.length - 1
                          ? "previous"
                          : "hidden";
                    return (
                      <article
                        className={`hero-slide hero-slide-${position}`}
                        key={slide.category}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} of ${heroSlides.length}: ${slide.category}`}
                        aria-hidden={position !== "current"}
                      >
                        <div
                          className="hero-slide-photo"
                          role="img"
                          aria-label={slide.alt}
                          style={{ backgroundImage: `url("${slide.image}")` }}
                        />
                        <div className="hero-slide-topline"><span>WILOPLAY ORIGINAL</span><AudioLines size={16} /></div>
                        <div className="hero-slide-copy">
                          <span>{slide.category}</span>
                          <strong>{slide.title}</strong>
                          <small>{slide.detail}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="hero-swiper-footer">
                  <span className="hero-swiper-count">0{heroSlideIndex + 1}<i>/</i>0{heroSlides.length}</span>
                  <div className="hero-swiper-dots" role="group" aria-label="Choose a featured story">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.category}
                        type="button"
                        aria-label={`Show ${slide.category.toLowerCase()}`}
                        aria-pressed={heroSlideIndex === index}
                        className={heroSlideIndex === index ? "is-active" : ""}
                        onClick={() => setHeroSlideIndex(index)}
                      />
                    ))}
                  </div>
                  <div className="hero-swiper-actions">
                    <button type="button" aria-label="Previous featured story" onClick={() => setHeroSlideIndex((index) => (index + heroSlides.length - 1) % heroSlides.length)}><ArrowLeft size={15} /></button>
                    <button type="button" aria-label={heroAutoplayPaused ? "Resume featured stories" : "Pause featured stories"} aria-pressed={heroAutoplayPaused} onClick={() => setHeroAutoplayPaused((paused) => !paused)}>{heroAutoplayPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}</button>
                    <button type="button" aria-label="Next featured story" onClick={() => setHeroSlideIndex((index) => (index + 1) % heroSlides.length)}><ArrowRight size={15} /></button>
                  </div>
                </div>
                <div className="hero-floating-note" aria-hidden="true">
                  <span><AudioLines size={18} /></span>
                  <div><small>ON THE WILOPLAY RADAR</small><strong>{heroSlides[heroSlideIndex].category}</strong></div>
                  <i className="hero-note-pulse" />
                </div>
              </div>
            </div>
            <div className="hero-bottom"><span>01 — YOUR DAILY RESET</span><span>MADE FOR THE MOMENT YOU&apos;RE IN <span className="hero-bottom-dash">↗</span></span></div>
          </section>

          <section className="section discovery-section" id="discovery">
            <div className="section-heading">
              <div><span className="section-kicker">A GOOD PLACE TO START</span><h2>{query ? "Your search, your sound." : "What are we feeling?"}</h2><p>{query ? `Showing the good stuff for “${query}”` : <>A little moodboard for wherever your head&apos;s at.</>}</p></div>
              <button className="text-link" onClick={openSearch}>Search something <ArrowRight size={15} /></button>
            </div>
            <div className="mood-grid" id="for-you">{moods.map((mood, index) => (
              <button className="mood-card" key={mood.label} style={{ "--mood-color": mood.color, "--mood-image": `url(https://images.unsplash.com/${mood.art}?w=850&h=420&fit=crop)` } as React.CSSProperties} onClick={() => { setQuery(mood.query); void searchTracks(mood.query); document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" }); }}>
                <div className="mood-art" /><span className="mood-number">0{index + 1} / MOOD</span><span className="mood-card-copy"><strong>{mood.label}</strong><small>{mood.sub}</small></span><span className="mood-play"><Play size={15} fill="currentColor" /></span>
              </button>
            ))}</div>
            {catalogGenres.length > 0 && (
              <div className="search-filter-row search-filter-row-inline catalog-genre-row" aria-label="Browse catalog genres">
                {catalogGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className={`search-filter${activeCatalogGenre === genre ? " is-active" : ""}`}
                    onClick={() => {
                      void browseCatalogGenre(genre);
                      document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="section top-charts-section" id="top-charts">
            <div className="section-heading">
              <div><span className="section-kicker">LISTENING RIGHT NOW</span><h2>WiloPlay charts.</h2><p>{chartError ? "Take a breath, then find your next favorite." : "The tracks, artists, and albums making waves."}</p></div>
              {chart ? <a className="text-link" href="https://www.deezer.com/channels/explore" target="_blank" rel="noreferrer">Explore on Deezer <ArrowRight size={15} /></a> : chartError ? <button className="text-link" onClick={() => void loadChart()}><RefreshCw size={14} /> Try again</button> : null}
            </div>
            {chartError && <div className="music-service-state" role="status">
              <div className="service-state-art" aria-hidden="true"><AudioLines size={34} /><Disc3 size={24} /></div>
              <div className="service-state-copy"><span className="section-kicker">A MOMENT BETWEEN TRACKS</span><h3>The charts are catching their breath.</h3><p>The outside charts didn&apos;t come through this time. Wiloplay artist releases are still here whenever you&apos;re ready.</p></div>
              <div className="service-state-actions"><button onClick={() => void loadChart()}><RefreshCw size={14} /> Try charts again</button><button className="service-state-secondary" onClick={() => document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" })}>Explore Wiloplay music <ArrowRight size={14} /></button></div>
            </div>}
            {!chart && !chartError && chartLoading && <div className="chart-loading-card" role="status"><AudioLines size={18} /><span>Finding the day&apos;s soundtrack…</span></div>}
            {chart && <>
              <section className="chart-group" aria-labelledby="top-tracks-heading">
                <div className="chart-group-heading"><h3 id="top-tracks-heading">Top tracks</h3><span className="source-note"><Disc3 size={14} /> Play previews</span></div>
                <div className="track-list chart-track-list">
                  {chart.tracks.slice(0, 5).map((track, index) => {
                    const isCurrent = current?.id === track.id;
                    return <div className={`track-row ${isCurrent ? "track-current" : ""}`} key={track.id}>
                      <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                      <button className="track-art-button" aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`} onClick={() => toggleTrack(track)}><Cover src={track.cover} alt={`${track.title} cover`} /><span className="track-overlay">{isCurrent && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</span></button>
                      <button className="track-title" onClick={() => toggleTrack(track)}><strong>{track.title}</strong><span>{track.artist}</span></button>
                      <span className="track-album">{track.album}</span>
                      <span className="track-duration">{formatTime(track.duration)}</span>
                    </div>;
                  })}
                </div>
              </section>
              <section className="chart-group" aria-labelledby="top-artists-heading">
                <div className="chart-group-heading"><h3 id="top-artists-heading">Top artists</h3><span className="source-note">On Deezer</span></div>
                <div className="chart-card-grid artist-chart-grid">
                  {chart.artists.slice(0, 5).map((artist, index) => <button className="chart-card artist-chart-card" key={artist.id} onClick={() => void loadArtistDetails(artist)} disabled={loadingArtistId === artist.id}>
                    <span className="chart-rank">{String(index + 1).padStart(2, "0")}</span><Cover src={artist.picture} alt={`${artist.name} portrait`} className="artist-chart-image" /><strong>{artist.name}</strong><span>{loadingArtistId === artist.id ? "Loading…" : "Artist details"} <ArrowRight size={13} /></span>
                  </button>)}
                </div>
                {artistDetailsError && <div className="inline-error" role="alert">{artistDetailsError}</div>}
                {artistDetails && <section className="artist-detail-panel" aria-label={`${artistDetails.artist.name} details`}>
                  <div className="artist-detail-header">
                    <Cover src={artistDetails.artist.picture} alt={`${artistDetails.artist.name} portrait`} className="artist-detail-image" />
                    <div><span className="section-kicker">ARTIST SPOTLIGHT</span><h4>{artistDetails.artist.name}</h4><span>{artistDetails.artist.fans.toLocaleString()} Deezer fans</span></div>
                    <a className="text-link" href={artistDetails.artist.deezerUrl} target="_blank" rel="noreferrer">Deezer profile <ArrowRight size={14} /></a>
                  </div>
                  <div className="artist-detail-tracks">
                    {artistDetails.tracks.map((track, index) => <div className="artist-detail-track" key={track.id}>
                      <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                      <button className="track-art-button" aria-label={`Play ${track.title}`} onClick={() => toggleTrack(track)}><Cover src={track.cover} alt={`${track.title} cover`} /><span className="track-overlay"><Play size={14} fill="currentColor" /></span></button>
                      <button className="track-title" onClick={() => toggleTrack(track)}><strong>{track.title}</strong><span>{track.album}</span></button>
                      <span className="track-duration">{formatTime(track.duration)}</span>
                    </div>)}
                  </div>
                </section>}
              </section>
              <section className="chart-group" aria-labelledby="top-albums-heading">
                <div className="chart-group-heading"><h3 id="top-albums-heading">Top albums</h3><span className="source-note">On Deezer</span></div>
                <div className="chart-card-grid album-chart-grid">
                  {chart.albums.slice(0, 5).map((album, index) => <a className="chart-card album-chart-card" key={album.id} href={album.deezerUrl} target="_blank" rel="noreferrer">
                    <span className="chart-rank">{String(index + 1).padStart(2, "0")}</span><Cover src={album.cover} alt={`${album.title} cover`} /><strong>{album.title}</strong><span>{album.artist}</span>
                  </a>)}
                </div>
              </section>
            </>}
          </section>

          {uploadedAlbums.length > 0 && <section className="section uploaded-albums-section" id="albums">
            <div className="section-heading">
              <div><span className="section-kicker">FULL RELEASES, FROM THE SOURCE</span><h2>Albums on Wiloplay.</h2><p>Full-length releases shared by Wiloplay artists.</p></div>
            </div>
            <div className="uploaded-album-grid">
              {uploadedAlbums.slice(0, 8).map((album) => <a className="uploaded-album-card" href={`/album/${encodeURIComponent(album.id)}`} key={album.id}>
                <Cover src={album.cover} alt={`${album.title} cover`} />
                <strong>{album.title}</strong><span>{album.artist}</span><small>{album.trackCount} {album.trackCount === 1 ? "track" : "tracks"}</small>
              </a>)}
            </div>
          </section>}

          <section className="section listener-library" id="library">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR MUSIC, YOUR WAY</span><h2>{libraryTab === "playlist" ? playlistDetails?.name ?? "Your playlist" : "Your listening room."}</h2><p>{libraryTab === "playlist" ? playlistDetails?.description || "A collection made by you." : "Liked songs, listening history, and new finds picked from Wiloplay releases."}</p></div>
              {libraryTab === "playlist" && playlistDetails ? <button className="text-link library-delete-button" disabled={libraryBusy} onClick={() => void deleteCurrentPlaylist()}><Trash2 size={14} /> Delete playlist</button> : <button className="text-link" onClick={() => openPlaylistDialog()}><Plus size={15} /> New playlist</button>}
            </div>
            <div className="library-tabs" role="tablist" aria-label="Your music library">
              <button className={libraryTab === "recommendations" ? "is-active" : ""} role="tab" aria-selected={libraryTab === "recommendations"} onClick={() => openLibraryTab("recommendations")}><AudioLines size={14} />For you</button>
              <button className={libraryTab === "liked" ? "is-active" : ""} role="tab" aria-selected={libraryTab === "liked"} onClick={() => openLibraryTab("liked")}><Heart size={14} />Liked songs <span>{likedTracks.length}</span></button>
              <button className={libraryTab === "history" ? "is-active" : ""} role="tab" aria-selected={libraryTab === "history"} onClick={() => openLibraryTab("history")}><Clock3 size={14} />History</button>
              {playlists.map((playlist) => <button className={libraryTab === "playlist" && playlistDetails?.id === playlist.id ? "is-active" : ""} role="tab" aria-selected={libraryTab === "playlist" && playlistDetails?.id === playlist.id} key={playlist.id} onClick={() => void showPlaylist(playlist.id)}><ListMusic size={14} />{playlist.name}</button>)}
            </div>
            {libraryError && <div className="inline-error" role="alert">{libraryError}</div>}
            {!user ? <div className="library-empty-state"><div className="library-empty-art"><Heart size={25} /><AudioLines size={16} /></div><div><h3>Your next favorite belongs here.</h3><p>Sign in to save songs, make playlists, and pick up where you left off.</p></div><button onClick={() => { setAuthMode("login"); setModal("login"); }}>Sign in <ArrowRight size={14} /></button></div>
              : libraryLoading ? <div className="chart-loading-card"><AudioLines size={18} /><span>Getting your listening room ready…</span></div>
                : activeLibraryTracks.length ? <div className="library-track-list">
                  {activeLibraryTracks.map((track, index) => {
                    const isLiked = likedTrackKeys.includes(libraryTrackKey(track));
                    const isCurrent = current?.id === track.id;
                    return <article className={`library-track-row${isCurrent ? " track-current" : ""}`} key={`${libraryTrackKey(track)}-${index}`}>
                      <button className="library-track-play" aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`} onClick={() => toggleTrack(track, activeLibraryTracks)}><Cover src={track.cover} alt={`${track.title} cover`} /><span>{isCurrent && playing ? <Pause size={13} /> : <Play size={13} />}</span></button>
                      <div className="library-track-info"><strong>{track.title}</strong><small>{track.artist}{track.album || track.albumTitle ? ` · ${track.album ?? track.albumTitle}` : ""}</small></div>
                      <span className="library-track-duration">{formatTime(track.duration)}</span>
                      <button className={`library-icon-button${isLiked ? " is-active" : ""}`} aria-label={isLiked ? `Remove ${track.title} from liked songs` : `Like ${track.title}`} aria-pressed={isLiked} onClick={() => void toggleLikeTrack(track)}><Heart size={15} fill={isLiked ? "currentColor" : "none"} /></button>
                      {libraryTab === "playlist" ? <button className="library-icon-button" aria-label={`Remove ${track.title} from playlist`} disabled={libraryBusy} onClick={() => void removePlaylistTrack(track)}><Trash2 size={14} /></button> : <button className="library-icon-button" aria-label={`Add ${track.title} to playlist`} onClick={() => openPlaylistDialog(track)}><Plus size={15} /></button>}
                    </article>;
                  })}
                </div>
                : <div className="library-empty-state"><div className="library-empty-art"><Music2 size={25} /><Disc3 size={17} /></div><div><h3>{libraryTab === "liked" ? "Save the songs that stay with you." : libraryTab === "history" ? "Your listening story starts here." : libraryTab === "playlist" ? "This playlist is ready for its first track." : "A little more listening makes this yours."}</h3><p>{libraryTab === "liked" ? "Tap the heart beside a track to keep it close." : libraryTab === "history" ? "Start any full track or Deezer preview to build your history." : libraryTab === "playlist" ? "Add music from search, recommendations, or artist releases." : "Explore releases from Wiloplay artists and we’ll find more in the same lane."}</p></div><button onClick={() => document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" })}>Explore music <ArrowRight size={14} /></button></div>}
          </section>

          <section className="section tracks-section" id="track-list">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">{query ? "SEARCH RESULTS" : "THE FIRST SONG IS THE HARDEST"}</span><h2>{query ? `Results for “${query}”` : "Good things, on repeat."}</h2><p>{query ? `${shownTracks.length} playable track${shownTracks.length === 1 ? "" : "s"}${searchResults ? ` · ${searchResults.totals.artists} artist${searchResults.totals.artists === 1 ? "" : "s"} · ${searchResults.totals.events} show${searchResults.totals.events === 1 ? "" : "s"}` : ""}` : "Wiloplay uploads plus free full streams and commercial previews."}</p></div>
              <span className="source-note"><Disc3 size={14} /> {searchFilter === "wiloplay" ? "Wiloplay only" : searchFilter === "catalog" ? "Free catalog" : "Wiloplay + catalog"}</span>
            </div>
            {query.trim() && <div className="search-filter-row search-filter-row-inline">
              {([
                ["all", "All"],
                ["wiloplay", "Wiloplay"],
                ["catalog", "Catalog"],
                ["artists", "Artists"],
                ["shows", "Shows"],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" className={`search-filter${searchFilter === id ? " is-active" : ""}`} onClick={() => {
                  setSearchFilter(id);
                  if (id === "artists") document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" });
                  if (id === "shows") document.getElementById("shows")?.scrollIntoView({ behavior: "smooth" });
                }}>{label}</button>
              ))}
            </div>}
            {searchFilter === "artists" && searchResults?.artists.length ? <div className="search-entity-grid">{searchResults.artists.map((artist) => (
              <a className="search-entity-card" href={`/artist/${encodeURIComponent(artist.id)}`} key={artist.id}>
                <Cover src={artist.coverUrl ? `${API}${artist.coverUrl}` : ""} alt="" className="search-entity-cover" />
                <strong>{artist.name}</strong>
                <span>{artist.trackCount} release{artist.trackCount === 1 ? "" : "s"} · {artist.followers} followers</span>
              </a>
            ))}</div> : null}
            {searchFilter === "shows" && searchResults?.events.length ? <div className="search-entity-grid">{searchResults.events.map((eventItem) => (
              <button type="button" className="search-entity-card" key={eventItem.id} onClick={() => document.getElementById(`event-${eventItem.id}`)?.scrollIntoView({ behavior: "smooth" })}>
                <Cover src={eventItem.coverUrl ? `${API}${eventItem.coverUrl}` : ""} alt="" className="search-entity-cover" />
                <strong>{eventItem.title}</strong>
                <span>{eventItem.city} · {formatDate(eventItem.startsAt)}</span>
              </button>
            ))}</div> : null}
            {error && <div className="inline-error" role="status">{error}</div>}
            {searchError && <div className="music-service-state search-service-state" role="status">
              <div className="service-state-art" aria-hidden="true"><Search size={28} /><Music2 size={20} /></div>
              <div className="service-state-copy"><span className="section-kicker">THE SOUND IS STILL HERE</span><h3>Search is taking a little breather.</h3><p>{searchError} You can still play full tracks uploaded by Wiloplay artists.</p></div>
              <div className="service-state-actions"><button onClick={() => void searchTracks(query)}><RefreshCw size={14} /> Try search again</button><button className="service-state-secondary" onClick={() => { setQuery(""); void searchTracks(""); }}>Show all music <ArrowRight size={14} /></button></div>
            </div>}
            <div className="track-list">
              {shownTracks.length ? shownTracks.slice(0, 8).map((track, index) => {
                const isCurrent = current?.id === track.id;
                const isLiked = likedTrackKeys.includes(libraryTrackKey(track));
                return <div className={`track-row ${isCurrent ? "track-current" : ""}`} key={track.id}>
                  <span className="track-index">{isCurrent && playing ? <AudioLines size={15} /> : String(index + 1).padStart(2, "0")}</span>
                  <button className="track-art-button" aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`} onClick={() => toggleTrack(track)}><Cover src={track.cover} alt={`${track.title} cover`} /><span className="track-overlay">{isCurrent && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</span></button>
                  <div className="track-title-with-profile">
                    <button className="track-title" onClick={() => toggleTrack(track)}><strong>{track.title}</strong><span>{track.artist}{track.provider ? ` · ${catalogProviderLabel(track.provider)}${track.playback === "preview" ? " preview" : track.playback === "full" ? " full" : ""}` : ""}</span></button>
                    {track.artistProfileId && <a className="track-profile-link" href={`/artist/${encodeURIComponent(track.artistProfileId)}`} aria-label={`View ${track.artist} artist profile`} title={`View ${track.artist} artist profile`}><Users size={13} /><span>Profile</span></a>}
                  </div>
                  <span className="track-album">{track.album ?? track.attribution ?? "Your next favorite"}</span>
                  <div className="track-actions">
                    <button className={`track-heart${isLiked ? " hearted" : ""}`} aria-label={isLiked ? `Remove ${track.title} from liked songs` : `Like ${track.title}`} aria-pressed={isLiked} onClick={() => void toggleLikeTrack(track)}><Heart size={16} fill={isLiked ? "currentColor" : "none"} /></button>
                    <button className="track-heart track-add-button" aria-label={`Add ${track.title} to a playlist`} onClick={() => openPlaylistDialog(track)}><Plus size={15} /></button>
                  </div>
                  <span className="track-duration">{formatTime(track.duration)}</span>
                </div>;
              }) : searchError ? null : <div className="empty-search"><Search size={18} />Nothing found just yet. Try another search?</div>}
            </div>
            <button className="browse-more" onClick={openSearch}>Keep exploring <ArrowRight size={15} /></button>
          </section>

          <section className="artist-banner">
            <div className="artist-banner-art"><span>✳</span><span>♫</span><span>✴</span></div>
            <div className="artist-banner-copy"><span className="section-kicker">FOR THE ONES MAKING THE MUSIC</span><h2>Your music deserves<br />to be <em>out there.</em></h2><p>Share your tracks, put on a show, and find the people who get it.</p><button className="banner-cta" onClick={() => user?.role === "ARTIST" ? openUploadWizard() : user ? void becomeArtist() : (setAuthMode("signup"), setModal("signup"))}>{user?.role === "ARTIST" ? "Upload your music" : "Make your artist account"} <ArrowRight size={15} /></button></div>
            <span className="artist-banner-caption">YOUR NEXT CHAPTER STARTS HERE — 02</span>
          </section>

          <section className="tickets-cta-band" aria-label="Tickets">
            <div className="tickets-cta-copy">
              <span className="section-kicker">TICKETS, MADE CLEAR</span>
              <h2>Walk in ready.</h2>
              <p>A premium, calm path from show to door — pricing, payment, QR entry, and what happens next.</p>
            </div>
            <div className="tickets-cta-actions">
              <a className="tickets-cta-primary" href="/tickets">Explore tickets <ArrowRight size={15} /></a>
              <a className="tickets-cta-secondary" href="#shows">Browse live shows</a>
            </div>
          </section>

          <section className="section events-section" id="shows">
            <div className="section-heading">
              <div><span className="section-kicker">SOME THINGS SOUND BETTER TOGETHER</span><h2>Meet us at the show.</h2><p>Real rooms. Real music. A night you&apos;ll actually remember.</p></div>
              <div className="section-heading-actions">
                <a className="text-link" href="/tickets">How tickets work <ArrowRight size={15} /></a>
                <button className="text-link" onClick={() => user?.role === "ARTIST" ? openEventWizard() : user ? showMessage("Become an artist to put your next show on the map.") : (setAuthMode("signup"), setModal("signup"))}>Put on a show <Plus size={15} /></button>
              </div>
            </div>
            {upcomingEvents.length ? <div className="event-grid">{upcomingEvents.map((item, index) => <article className="event-card" id={`event-${item.id}`} key={item.id}>
              <div className="event-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 38%, rgba(18,16,24,.76)), url("${item.coverUrl || `https://images.unsplash.com/${["photo-1501386761578-eac5c94b800a", "photo-1506157786151-b8491531f063", "photo-1470225620780-dba8ba36b745"][index % 3]}?w=760&h=520&fit=crop`}")` }}><span className="event-date"><strong>{new Date(item.startsAt).getDate()}</strong><small>{new Date(item.startsAt).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</small></span><span className="event-price">{item.priceCents ? `From ${formatPrice(item.priceCents)} + 10% fee` : "Free"}</span></div>
              <div className="event-details"><span className="section-kicker">{item.city} · {formatDate(item.startsAt)}</span><h3>{item.title}</h3><span className="event-artist">{item.artistName} · {item.venue}</span><EventCountdown startsAt={item.startsAt} /><button className="ticket-button" disabled={busy || item.ticketsSold >= item.capacity} onClick={() => reserveTicket(item)}>{item.ticketsSold >= item.capacity ? "Sold out" : "Get a ticket"} <ArrowRight size={14} /></button></div>
            </article>)}</div> : <div className="events-empty"><div className="empty-ticket"><Ticket size={23} /></div><div><strong>The good nights are still ahead.</strong><span>Shows from artists on Wiloplay will show up here.</span></div><button onClick={() => user?.role === "ARTIST" ? openEventWizard() : user ? void becomeArtist() : (setAuthMode("signup"), setModal("signup"))}>Plan a show <ArrowRight size={14} /></button></div>}
          </section>

          <section className="section my-tickets-section" id="my-tickets">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR NEXT NIGHT OUT</span><h2>My tickets.</h2><p>Your bookings and entry codes, all in one place.</p></div>
              {user && <button className="text-link" onClick={() => void loadMyTicketOrders()}>Refresh tickets <ArrowRight size={15} /></button>}
            </div>
            {!user ? <div className="ticket-empty"><p>Sign in to see your bookings and QR codes.</p><button className="ticket-button" onClick={() => { setAuthMode("login"); setModal("login"); }}>Log in to your account</button></div>
              : activeTicketOrders.length ? <div className="my-ticket-grid">{activeTicketOrders.map((order) => (
                <article className="my-ticket-card" key={order.id}>
                  <div className="my-ticket-head"><div><span className="section-kicker">{formatDate(order.event.startsAt)} · {order.event.city}</span><h3>{order.event.title}</h3><span>{order.event.venue} · {order.event.artistName}</span></div><span className={`status-pill status-${order.paymentStatus.toLowerCase()}`}>{order.paymentMethod === "DEMO" ? "Demo ticket" : order.paymentStatus === "PAID" ? "Confirmed" : order.paymentStatus === "PENDING" ? "Awaiting transfer" : "Declined"}</span></div>
                  <EventCountdown startsAt={order.event.startsAt} ticket />
                  <p className="booking-reference">Booking reference <code>{order.paymentReference || order.id}</code> · {order.category?.name ?? "Ticket"} · {order.quantity} ticket{order.quantity === 1 ? "" : "s"} · Total {formatPrice(order.totalCents)}{order.paymentMethod === "DEMO" ? " · Demo only, not charged" : ""}</p>
                  {order.paymentStatus === "PENDING" && <div className="transfer-instructions"><strong>Paystack bank transfer · {formatPrice(order.totalCents)}</strong><p>Bank: {order.transferBankName || "Preparing account"}<br />Account number: {order.transferAccountNumber || "Preparing account"}<br />Account name: {order.transferAccountName || "Preparing account"}<br />Payment reference: {order.paymentReference || order.id}</p><small>Transfer the exact amount shown. Your tickets are issued only after Paystack verifies the payment.</small></div>}
                  {order.paymentStatus === "PAID" && order.tickets.length > 0 && <div className="qr-ticket-list">{order.tickets.map((ticket) => (
                    <div className="qr-ticket" key={ticket.id}><a href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`} aria-label={`Download ticket ${ticket.code}`}><img src={ticket.qrDataUrl} alt={`QR ticket ${ticket.code}`} /></a><div><strong>{ticket.checkedInAt ? "Already checked in" : "Ready for entry"}</strong><code>{ticket.code}</code><span>{ticket.checkedInAt ? `Scanned ${new Date(ticket.checkedInAt).toLocaleString()}` : "Show this QR code at the door."}</span><a className="ticket-download" href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`}><Download size={13} /> Download QR</a></div><BadgeCheck size={18} /></div>
                  ))}</div>}
                </article>
              ))}</div> : <div className="ticket-empty"><QrCode size={24} /><p>{myTicketOrders.length ? "Your show has passed. Tickets are automatically archived here after showtime; payment and entry records are preserved." : "Your ticket bookings will appear here after checkout."}</p></div>}
          </section>

          {user?.role === "ARTIST" && <section className="section sales-dashboard" id="ticket-sales">
            <div className="section-heading">
              <div><span className="section-kicker">ARTIST TOOLS</span><h2>Ticket sales &amp; check-in.</h2><p>Track verified payments, share your events, and scan tickets at the door.</p></div>
              <button className="text-link" onClick={openEventWizard}>Create an event <Plus size={15} /></button>
            </div>
            {error && <div className="inline-error" role="status">{error}</div>}
            <div className="artist-bank-account">
              <div><span className="section-kicker">PAYSTACK VIRTUAL ACCOUNT</span><strong>{artistVerified ? artistBankAccount?.accountName || "Creating your account..." : "Artist verification required"}</strong><span>{artistVerified ? artistBankAccount?.bankName || "Your account is being provisioned." : "Your bank account is created automatically after Wiloplay verifies your artist profile."}</span></div>
              {artistBankAccount?.accountNumber && <code>{artistBankAccount.accountNumber}</code>}
            </div>
            {activeSalesEvent ? <>
              <div className="sales-toolbar"><label>Choose an event<select value={activeSalesEvent.id} onChange={(event) => { setSelectedSalesEventId(event.target.value); setCheckInMessage(""); setCheckInError(""); }} aria-label="Choose an event">{artistEvents.map((item) => <option value={item.id} key={item.id}>{item.title} · {formatDate(item.startsAt)}</option>)}</select></label><div className="sales-metrics"><span><strong>{activeSalesEvent.paidTickets}</strong> paid</span><span><strong>{activeSalesEvent.demoTickets}</strong> demo</span><span><strong>{activeSalesEvent.pendingTickets}</strong> pending</span><span><strong>{formatPrice(activeSalesEvent.revenueCents)}</strong> artist revenue</span><span><strong>{formatPrice(activeSalesEvent.platformFeesCents)}</strong> Wiloplay fees</span><span><strong>{Math.max(activeSalesEvent.capacity - activeSalesEvent.ticketsSold, 0)}</strong> left</span></div></div>
              <div className="event-share-actions" aria-label={`Share ${activeSalesEvent.title}`}>
                <span>Share this event</span>
                <button onClick={() => void shareEvent(activeSalesEvent, "TikTok")}>TikTok</button>
                <button onClick={() => void shareEvent(activeSalesEvent, "WhatsApp")}>WhatsApp</button>
                <button onClick={() => void shareEvent(activeSalesEvent, "Instagram")}>Instagram</button>
                <button onClick={() => void shareEvent(activeSalesEvent, "X")}>Twitter / X</button>
              </div>
              <div className="artist-event-actions">
                {activeSalesEvent.ticketsSold >= activeSalesEvent.capacity && <form className="add-capacity-form" onSubmit={(event) => void addEventCapacity(event)}>
                  <label>Add more tickets<input type="number" min="1" max="100000" value={additionalTickets} onChange={(event) => setAdditionalTickets(Math.max(1, Number(event.target.value)))} /></label>
                  <button className="scanner-button" disabled={busy}><Plus size={14} /> Add inventory</button>
                </form>}
                <button className="scanner-button" disabled={busy || activeSalesEvent.paidTickets === 0} onClick={() => setNotificationOpen((open) => !open)}><BellRing size={14} /> Notify ticket holders</button>
              </div>
              {notificationOpen && <form className="event-notification-form" onSubmit={(event) => void sendEventNotification(event)}>
                <label htmlFor="attendee-message">Event update for paid ticket holders</label>
                <textarea id="attendee-message" value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} maxLength={1000} required placeholder="Share a schedule change, reminder, or important event detail." />
                <button className="form-submit" disabled={busy || !notificationMessage.trim()}>{busy ? "Sending update..." : "Send email update"} <ArrowRight size={14} /></button>
                <small>Updates are emailed to paid ticket holders. SMTP must be configured.</small>
              </form>}
              <div className="check-in-panel">
                <div className="check-in-heading"><div><span className="section-kicker">AT THE DOOR</span><h3>Scan a ticket</h3></div><button className="scanner-button" type="button" onClick={() => { setCheckInError(""); setScannerOpen((open) => !open); }}>{scannerOpen ? "Stop camera" : <><ScanLine size={15} /> Open camera scanner</>}</button></div>
                {scannerOpen && <video className="ticket-scanner" ref={videoRef} muted playsInline aria-label="Live ticket QR scanner" />}
                <form className="check-in-form" onSubmit={(event) => void checkInTicket(event)}><input value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="Scan QR or enter ticket code" aria-label="Ticket code" required /><button className="form-submit" disabled={busy || !ticketCode.trim()}><Check size={15} /> Check in</button></form>
                {checkInMessage && <p className="check-in-success" role="status">{checkInMessage}</p>}
                {checkInError && <p className="form-error" role="alert">{checkInError}</p>}
              </div>
              <div className="sales-orders">
                <h3>Recent bookings</h3>
                {activeSalesEvent.orders.length ? activeSalesEvent.orders.map((order) => <article className="sales-order" key={order.id}>
                  <div><strong>{order.user?.name ?? "Listener"}{order.paymentMethod === "DEMO" && <span className="demo-order-chip">DEMO</span>}</strong><span>{order.user?.email} · {order.category?.name ?? "Ticket"} · {order.quantity} ticket{order.quantity === 1 ? "" : "s"} · Total {formatPrice(order.totalCents)}</span><small>{order.paymentMethod === "DEMO" ? "Simulated booking · not real revenue" : `Artist share ${formatPrice(order.totalCents - order.platformFeeCents)} · Wiloplay fee ${formatPrice(order.platformFeeCents)}`} · {order.paymentStatus}</small></div>
                  {order.paymentStatus === "PENDING" ? <span className="order-checkin">Awaiting Paystack verification</span> : <span className="order-checkin">{order.tickets.filter((ticket) => ticket.checkedInAt).length}/{order.tickets.length} checked in</span>}
                </article>) : <div className="ticket-empty"><p>No ticket bookings yet. Share your event to get started.</p></div>}
              </div>
            </> : <div className="ticket-empty"><Ticket size={24} /><p>Create an event to start selling and managing tickets.</p><button className="ticket-button" onClick={openEventWizard}>Create your first event</button></div>}
          </section>}

          {user?.role === "ARTIST" && <section className="section artist-music-manager" id="artist-music">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR RELEASES</span><h2>Manage your music.</h2><p>Edit release details, remove tracks, and share your songs. {aiConfiguration && (!aiConfiguration.openAiEnabled || !aiConfiguration.auphonicEnabled) ? "AI tools need provider credentials in the API environment." : ""}</p></div>
              <button className="text-link" onClick={openUploadWizard}><Plus size={15} /> Upload release</button>
            </div>
            {artistTracks.length ? <div className="artist-music-list">{artistTracks.map((track) => (
              <article className="artist-music-row" key={track.id}>
                <Cover src={track.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop"} alt={`${track.title} cover`} className="artist-music-cover" />
                {editingTrackId === track.id ? <form className="music-edit-form" onSubmit={(event) => void updateArtistTrack(event, track)}>
                  <label>Track title<input name="title" defaultValue={track.title} required maxLength={100} /></label>
                  <label>Genre<select name="genre" defaultValue={track.genre ?? "Other"}>{musicGenres.map((genre) => <option key={genre}>{genre}</option>)}</select></label>
                  {track.releaseType === "ALBUM" && <label>Album title<input name="albumTitle" defaultValue={track.albumTitle ?? ""} maxLength={100} /></label>}
                  <label className="music-description-field">Release description<textarea name="releaseDescription" defaultValue={track.releaseDescription ?? ""} maxLength={500} rows={3} /></label>
                  <button className="scanner-button" disabled={busy}>Save changes</button>
                </form> : <div className="artist-music-info">
                  <strong>{track.title}</strong>
                  <span>{track.genre ?? "Other"} · {track.releaseType === "ALBUM" ? `Album: ${track.albumTitle ?? "Untitled"}` : "Single"}</span>
                  <div className="music-share-actions" aria-label={`Share ${track.title}`}>
                    <button onClick={() => shareTrack(track, "WhatsApp")}>WhatsApp</button>
                    <button onClick={() => shareTrack(track, "Facebook")}>Facebook</button>
                    <button onClick={() => shareTrack(track, "X")}>X</button>
                    <button aria-label={`Copy link to ${track.title}`} onClick={() => void copyTrackLink(track)}><Link2 size={13} /> Copy link</button>
                    <button disabled={busy || !aiConfiguration?.openAiEnabled} onClick={() => void suggestTrackMetadata(track)}>AI suggestions</button>
                    <button disabled={busy || !aiConfiguration?.openAiEnabled} onClick={() => void generateTrackCover(track)}>Generate cover</button>
                  </div>
                  {trackSuggestions[String(track.id)] && <div className="music-ai-suggestions">
                    <strong>Suggested metadata</strong>
                    <span>{trackSuggestions[String(track.id)].title} · {trackSuggestions[String(track.id)].genre}</span>
                    <p>{trackSuggestions[String(track.id)].releaseDescription}</p>
                    <div><button disabled={busy} onClick={() => void applyTrackSuggestions(track, trackSuggestions[String(track.id)])}>Use suggestions</button><button onClick={() => setTrackSuggestions((old) => { const next = { ...old }; delete next[String(track.id)]; return next; })}>Dismiss</button></div>
                  </div>}
                  <div className="music-ai-actions">
                    <button disabled={busy || !aiConfiguration?.auphonicEnabled || Boolean(track.enhancedAudioUrl) || Boolean(track.aiProductionStatus && !["Done", "Error", "Incomplete"].includes(track.aiProductionStatus))} onClick={() => void startAudioEnhancement(track)}>
                      {track.enhancedAudioUrl ? "Audio enhanced" : track.aiProductionStatus && !["Done", "Error", "Incomplete"].includes(track.aiProductionStatus) ? "Enhancing audio…" : "Enhance audio"}
                    </button>
                    {track.aiProductionStatus && <span>{track.aiProductionStatus === "Error" ? "Enhancement failed; try again." : `Audio: ${track.aiProductionStatus}`}</span>}
                    {track.enhancedAudioUrl && <button onClick={() => track.enhancedAudioUrl && toggleTrack({ ...track, audioUrl: track.enhancedAudioUrl })}>Preview enhanced</button>}
                  </div>
                </div>}
                <div className="music-management-actions">
                  <button aria-label={`Edit ${track.title}`} onClick={() => setEditingTrackId(editingTrackId === track.id ? null : track.id)}><Pencil size={15} /></button>
                  <button aria-label={`Delete ${track.title}`} disabled={busy} onClick={() => void deleteArtistTrack(track)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}</div> : <div className="ticket-empty"><p>Your uploaded singles and albums will appear here.</p><button className="ticket-button" onClick={openUploadWizard}>Upload your first release</button></div>}
          </section>}

          <footer className="footer"><a href="#" className="brand footer-brand"><span className="brand-mark"><AudioLines size={18} /></span><span>wiloplay<span className="brand-dot">.</span></span></a><span>Made for music people. Wherever you find them.</span><div><a href="/sound">Discover</a><a href="/tickets">Tickets</a><a href="#shows">Live shows</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button onClick={() => showMessage("More good things are on the way.")}>About us</button></div></footer>
        </div>
      </section>

      <div className={`player${playerExpanded ? " player-expanded" : ""}`} role="region" aria-label={playerExpanded ? "Expanded music player" : "Music player"}>
        <audio ref={audioRef} onPlay={recordPlaybackHistory} onTimeUpdate={(event) => { setElapsed(event.currentTarget.currentTime); recordQualifiedListen(event.currentTarget); }} onDurationChange={(event) => { if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration); }} onEnded={() => {
          if (repeatMode === "one" && audioRef.current) {
            audioRef.current.currentTime = 0;
            setElapsed(0);
            setPlaying(true);
            return;
          }
          stepQueue(1, true);
        }} onError={() => { if (current && playing) { setPlaying(false); showMessage("This audio couldn't start. Try another track."); } }} />
        <div className="player-track">
          {current ? <><Cover src={current.cover} alt="" className="player-cover" /><div className="player-track-info"><strong>{current.title}</strong><span>{current.artist}</span></div><a className="player-lyrics-link" href={lyricsSearchUrl(current)} target="_blank" rel="noopener noreferrer" aria-label={`Search lyrics for ${current.title} by ${current.artist}`} title="Find lyrics on Genius"><ListMusic size={14} /><span>Lyrics</span></a><button className={`player-heart${likedTrackKeys.includes(libraryTrackKey(current)) ? " hearted" : ""}`} aria-label={likedTrackKeys.includes(libraryTrackKey(current)) ? "Remove from liked songs" : "Add to liked songs"} aria-pressed={likedTrackKeys.includes(libraryTrackKey(current))} onClick={() => void toggleLikeTrack(current)}><Heart size={15} fill={likedTrackKeys.includes(libraryTrackKey(current)) ? "currentColor" : "none"} /></button></> : <><div className="player-placeholder"><Headphones size={17} /></div><div className="player-track-info"><strong>Your next favorite is out there.</strong><span>Press play and see where you end up.</span></div></>}
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button className={`player-minor player-toggle${shuffle ? " is-active" : ""}`} aria-label={`Shuffle ${shuffle ? "on" : "off"}`} aria-pressed={shuffle} onClick={() => setShuffle((value) => !value)}><Shuffle size={14} /></button>
            <button className="player-minor" aria-label="Previous track" onClick={() => stepQueue(-1)}><ArrowLeft size={14} /></button>
            <button className="player-play" aria-label={playing ? "Pause" : "Play"} onClick={() => current ? setPlaying(!playing) : shownTracks[0] && toggleTrack(shownTracks[0])}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
            <button className="player-minor" aria-label="Next track" onClick={() => stepQueue(1)}><ArrowRight size={14} /></button>
            <button className={`player-minor player-toggle${repeatMode !== "off" ? " is-active" : ""}`} aria-label={`Repeat ${repeatMode}`} aria-pressed={repeatMode !== "off"} onClick={() => setRepeatMode((value) => value === "off" ? "all" : value === "all" ? "one" : "off")}><Repeat size={14} /><span className="repeat-mode-indicator">{repeatMode === "one" ? "1" : ""}</span></button>
          </div>
          <div className="progress-row"><span>{formatTime(elapsed)}</span><input className="progress-slider" aria-label="Seek through track" type="range" min="0" max={mediaDuration || 0} step="1" value={Math.min(elapsed, mediaDuration || 0)} disabled={!mediaDuration} onChange={(event) => { const time = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = time; setElapsed(time); }} /><span>{formatTime(mediaDuration || current?.duration)}</span></div>
        </div>
        <div className="player-right"><details className="location-sharing-control"><summary><MapPin size={14} /><span>{listenCity ? `City: ${listenCity}` : "Share city"}</span></summary><form onSubmit={saveListenerCity}><label htmlFor="listener-city">Optional city for trend analytics</label><input id="listener-city" value={cityDraft} maxLength={80} onChange={(event) => setCityDraft(event.target.value)} placeholder="e.g. Lagos" /><small>Only your city is shared, and artist profiles show aggregated totals. No GPS is used.</small><button>{listenCity ? "Update city" : "Share city"}</button>{listenCity && <button type="button" className="city-sharing-stop" onClick={() => void stopCitySharing()}>Stop sharing</button>}</form></details><Volume2 size={16} /><input className="volume-slider" aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const level = Number(event.target.value); setVolume(level); if (audioRef.current) audioRef.current.volume = level; }} /><button className="queue-btn" aria-label="Toggle play queue" aria-expanded={queueOpen} onClick={() => setQueueOpen((open) => !open)}><Menu size={18} /></button></div>
        <button className="player-expand-button" type="button" aria-label={playerExpanded ? "Minimize player" : "Maximize player"} aria-expanded={playerExpanded} onClick={() => { setPlayerExpanded((expanded) => !expanded); setQueueOpen(false); }}>
          {playerExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>

      {queueOpen && <aside className="queue-panel" aria-label="Play queue">
        <div className="queue-panel-heading"><div><span className="section-kicker">UP NEXT</span><strong>Your queue</strong></div><button aria-label="Close queue" onClick={() => setQueueOpen(false)}><X size={15} /></button></div>
        {(queue.length ? queue : shownTracks.filter((track) => track.preview || track.audioUrl)).slice(0, 12).map((track, index) => <button className={`queue-track${current?.id === track.id ? " is-current" : ""}`} key={`${track.id}-${index}`} onClick={() => toggleTrack(track, queue.length ? queue : shownTracks)}><Cover src={track.cover} alt="" /><span><strong>{track.title}</strong><small>{track.artist}</small></span><Play size={13} /></button>)}
        {!queue.length && !shownTracks.some((track) => track.preview || track.audioUrl) && <p className="queue-empty">Start a track to build your queue.</p>}
      </aside>}

      <div className="toast-stack" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.tone}${toast.leaving ? " is-leaving" : " is-visible"}`}
            role="status"
          >
            <span className="toast-icon" aria-hidden="true">
              {toast.tone === "error" ? <AlertTriangle size={15} /> : toast.tone === "info" ? <Info size={15} /> : <Check size={15} />}
            </span>
            <p className="toast-copy">{toast.message}</p>
            <button type="button" className="toast-dismiss" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {playlistDialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !libraryBusy) { setPlaylistDialog(null); setLibraryError(""); } }}>
        <section className="modal-card playlist-dialog" role="dialog" aria-modal="true" aria-labelledby="playlist-dialog-heading">
          <button className="modal-close" aria-label="Close playlist dialog" disabled={libraryBusy} onClick={() => { setPlaylistDialog(null); setLibraryError(""); }}><X size={18} /></button>
          <div className="modal-logo"><ListMusic size={21} /></div>
          <span className="section-kicker">MAKE IT YOURS</span>
          <h2 id="playlist-dialog-heading">{playlistDialog.mode === "create" ? "A new playlist." : "Save it for later."}</h2>
          <p className="modal-subtitle">{playlistDialog.track ? `Add “${playlistDialog.track.title}” to a playlist.` : "Give your favorite sounds a place of their own."}</p>
          <form className="modal-form" onSubmit={(event) => void submitPlaylistDialog(event)}>
            {playlistDialog.mode === "create" ? <>
              <label>Playlist name<input value={playlistNameDraft} onChange={(event) => setPlaylistNameDraft(event.target.value)} placeholder="Late-night favorites" maxLength={60} required /></label>
              <label>Description <span className="wizard-optional">OPTIONAL</span><textarea value={playlistDescriptionDraft} onChange={(event) => setPlaylistDescriptionDraft(event.target.value)} placeholder="A little note about this mix" maxLength={240} rows={3} /></label>
            </> : <label>Choose a playlist<select value={playlistChoiceId} onChange={(event) => setPlaylistChoiceId(event.target.value)} required>{playlists.map((playlist) => <option value={playlist.id} key={playlist.id}>{playlist.name}</option>)}</select></label>}
            {libraryError && <div className="form-error" role="alert">{libraryError}</div>}
            <button className="form-submit" disabled={libraryBusy || (playlistDialog.mode === "add" && !playlistChoiceId)}>{libraryBusy ? "Saving…" : playlistDialog.mode === "create" ? "Create playlist" : "Add to playlist"} <ArrowRight size={15} /></button>
          </form>
        </section>
      </div>}

      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <section key={modal} className={`modal-card${modal === "upload" || modal === "event" ? " wizard-modal" : ""}${modal === "login" || modal === "signup" || modal === "forgot-password" || modal === "reset-password" || modal === "email-verification" || modal === "settings" ? " auth-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-heading">
          <button className="modal-close" aria-label="Close dialog" onClick={closeModal}><X size={18} /></button>
          {(modal === "login" || modal === "signup") ? <>
            <div className="auth-modal-hero">
              <div className="modal-logo"><AudioLines size={21} /></div>
              <span className="section-kicker">YOUR PEOPLE ARE HERE</span>
              <h2 id="modal-heading">{authMode === "signup" ? "Create your account." : "Welcome back."}</h2>
              <p className="modal-subtitle">{authMode === "signup" ? "One account for music, tickets, and the artists you love." : "Pick up right where the music left off."}</p>
              <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
                <button type="button" role="tab" aria-selected={authMode === "login"} className={authMode === "login" ? "is-active" : ""} onClick={() => { setAuthMode("login"); setModal("login"); setAuthPasswordVisible(false); setError(""); setFieldErrors({}); }}>Log in</button>
                <button type="button" role="tab" aria-selected={authMode === "signup"} className={authMode === "signup" ? "is-active" : ""} onClick={() => { setAuthMode("signup"); setModal("signup"); setAuthPasswordVisible(false); setError(""); setFieldErrors({}); }}>Sign up</button>
              </div>
            </div>
            <div className="auth-modal-body">
              <form key={`auth-${authMode}`} className="modal-form auth-form" onSubmit={(event) => void handleAuth(event)}>
                {authMode === "signup" && <label>Your name<input name="name" autoComplete="name" placeholder="How should we call you?" value={authDraft.name} onChange={(event) => setAuthDraft((draft) => ({ ...draft, name: event.target.value }))} aria-invalid={Boolean(fieldErrors.name)} required minLength={2} maxLength={60} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</label>}
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@somewhere.com" value={authDraft.email} onChange={(event) => setAuthDraft((draft) => ({ ...draft, email: event.target.value }))} aria-invalid={Boolean(fieldErrors.email)} required />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</label>
                <label>Password
                  <span className="password-field">
                    <input id="auth-password" name="password" type={authPasswordVisible ? "text" : "password"} autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder={authMode === "signup" ? "8+ chars, letter and number" : "Your password"} value={authDraft.password} onChange={(event) => setAuthDraft((draft) => ({ ...draft, password: event.target.value }))} aria-invalid={Boolean(fieldErrors.password)} minLength={8} required />
                    <button className="password-visibility-toggle" type="button" aria-label={authPasswordVisible ? "Hide password" : "Show password"} aria-pressed={authPasswordVisible} aria-controls="auth-password" onClick={() => setAuthPasswordVisible((visible) => !visible)}>{authPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </span>
                  {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
                </label>
                {authMode === "signup" && <>
                  <p className="auth-legal-notice" role="note"><Info size={15} aria-hidden="true" /><span>By creating an account, you agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a> and acknowledge the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></p>
                  <p className="auth-legal-copy">We&apos;ll email a verification code before your account is fully active.</p>
                </>}
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="form-submit" disabled={busy}>{busy ? "One second..." : authMode === "signup" ? "Create your account" : "Log in"} <ArrowRight size={15} /></button>
              </form>
              {authMode === "login" && <div className="auth-link-row"><button type="button" onClick={() => { setError(""); setFieldErrors({}); setModal("forgot-password"); }}>Forgot password?</button><button type="button" onClick={() => { setError(""); setFieldErrors({}); setModal("forgot-password"); }}>Resend password reset</button></div>}
              <p className="auth-legal-links"><a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a><span>·</span><a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            </div>
          </> : modal === "forgot-password" ? <>
            <div className="auth-modal-body auth-modal-body-solo">
              <div className="modal-logo"><AudioLines size={21} /></div>
              <span className="section-kicker">ACCOUNT RECOVERY</span><h2 id="modal-heading">Reset your password.</h2>
              <p className="modal-subtitle">Enter the email on your account. We&apos;ll send a six-digit code if it matches. You can also use this to resend a password reset code.</p>
              <form className="modal-form" onSubmit={(event) => void submitForgotPassword(event)}>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@somewhere.com" value={authDraft.email} onChange={(event) => setAuthDraft((draft) => ({ ...draft, email: event.target.value }))} required /></label>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="form-submit" disabled={busy || !authDraft.email.trim()}>{busy ? "Sending..." : "Send reset code"} <ArrowRight size={15} /></button>
              </form>
              <div className="auth-link-row"><button type="button" onClick={() => { setAuthMode("login"); setModal("login"); setError(""); }}>Back to log in</button><button type="button" onClick={() => { setAuthMode("signup"); setModal("signup"); setError(""); }}>Create an account</button></div>
              <p className="auth-legal-links"><a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a><span>·</span><a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            </div>
          </> : modal === "reset-password" ? <>
            <div className="auth-modal-body auth-modal-body-solo">
              <div className="modal-logo"><AudioLines size={21} /></div>
              <span className="section-kicker">CHOOSE A NEW PASSWORD</span><h2 id="modal-heading">Almost there.</h2>
              <p className="modal-subtitle">Enter the code sent to <strong>{verificationEmail}</strong> and pick a new password. Codes expire in {Math.max(1, Math.ceil(resetExpiresInSeconds / 60))} minutes.</p>
              <form className="modal-form" onSubmit={(event) => void submitResetPassword(event)}>
                <label>Reset code<input className="email-verification-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
                <label>New password
                  <span className="password-field">
                    <input id="reset-password" name="password" type={resetPasswordVisible ? "text" : "password"} autoComplete="new-password" placeholder="8+ chars, letter and number" value={resetPasswordDraft} onChange={(event) => setResetPasswordDraft(event.target.value)} minLength={8} required />
                    <button className="password-visibility-toggle" type="button" aria-label={resetPasswordVisible ? "Hide password" : "Show password"} aria-pressed={resetPasswordVisible} aria-controls="reset-password" onClick={() => setResetPasswordVisible((visible) => !visible)}>{resetPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </span>
                </label>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="form-submit" disabled={busy || resetCode.length !== 6 || resetPasswordDraft.length < 8}>{busy ? "Saving..." : "Update password"} <ArrowRight size={15} /></button>
              </form>
              <div className="auth-link-row"><button type="button" disabled={busy} onClick={() => { setModal("forgot-password"); setError(""); }}>Resend password reset code</button><button type="button" onClick={() => { setAuthMode("login"); setModal("login"); setError(""); }}>Back to log in</button></div>
            </div>
          </> : modal === "email-verification" ? <>
            <div className="auth-modal-body auth-modal-body-solo">
              <div className="modal-logo"><AudioLines size={21} /></div>
              <span className="section-kicker">CHECK YOUR INBOX</span><h2 id="modal-heading">Verify your email.</h2>
              <p className="modal-subtitle">We sent a six-digit code to <strong>{verificationEmail}</strong>. It expires in {Math.max(1, Math.ceil(verificationExpiresInSeconds / 60))} minutes. Logging in again continues here until you verify.</p>
              <form className="modal-form" onSubmit={(event) => void verifyEmail(event)}>
                <label>Verification code<input className="email-verification-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="form-submit" disabled={busy || verificationCode.length !== 6}>{busy ? "Verifying..." : "Verify email"} <ArrowRight size={15} /></button>
              </form>
              <div className="auth-link-row"><button type="button" disabled={busy} onClick={() => void resendEmailVerification()}>Resend verification code</button><button type="button" onClick={() => { setAuthMode("login"); setModal("login"); setError(""); }}>Back to log in</button></div>
              <p className="auth-legal-links"><a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a><span>·</span><a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            </div>
          </> : modal === "settings" ? <>
            <div className="auth-modal-body auth-modal-body-solo">
              <div className="modal-logo"><Settings size={21} /></div>
              <span className="section-kicker">YOUR ACCOUNT</span>
              <h2 id="modal-heading">Profile &amp; settings.</h2>
              <p className="modal-subtitle">Update how you show up on Wiloplay and manage account preferences.</p>
              <div className="settings-summary">
                <span className="avatar">{(user?.name ?? "W").slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{user?.name}</strong>
                  <small>{user?.email}</small>
                  <small>{user?.role === "ARTIST" ? "Artist account" : "Listener account"}{user?.emailVerifiedAt ? " · Verified" : ""}</small>
                </div>
              </div>
              <form className="modal-form auth-form" onSubmit={(event) => void submitSettings(event)}>
                <label>Display name<input value={settingsName} onChange={(event) => setSettingsName(event.target.value)} maxLength={60} required /></label>
                <label>City for trends <span className="wizard-optional">OPTIONAL</span><input value={cityDraft} onChange={(event) => setCityDraft(event.target.value)} placeholder="e.g. Lagos" maxLength={80} /></label>
                <div className="settings-row">
                  <div><strong>Appearance</strong><small>Switch between light and dark mode</small></div>
                  <button className="theme-toggle" type="button" onClick={toggleTheme}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button>
                </div>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="form-submit" type="submit">Save settings <ArrowRight size={15} /></button>
              </form>
              <div className="auth-link-row">
                {user?.role === "ARTIST" && <a href={`/artist/${encodeURIComponent(user.id)}`}>Open artist profile</a>}
                <button type="button" onClick={() => { closeModal(); logout(); }}>Sign out</button>
              </div>
              <p className="auth-legal-links"><a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a><span>·</span><a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></p>
            </div>
          </> : modal === "upload" ? <>
            <div className="modal-logo"><AudioLines size={21} /></div>
            <span className="section-kicker">GET YOUR MUSIC OUT THERE</span><h2 id="modal-heading">Share a new release.</h2><p className="modal-subtitle">Upload a single or group tracks into an album with one shared cover.</p>
            <form className="modal-form wizard-form" ref={uploadFormRef} onSubmit={(event) => void uploadTrack(event)}>
              <WizardProgress steps={["Release details", "Audio & artwork", "Review"]} activeStep={uploadStep} />
              {uploadStep === 0 && <div className="wizard-stage" key="upload-details">
                <div className="wizard-stage-heading"><span>STEP 1 OF 3</span><h3>Start with the essentials</h3><p>Tell listeners who made this and what they&apos;re about to hear.</p></div>
                <div className="wizard-field-grid">
                  <label>Artist name<input value={uploadDraft.artistName} onChange={(event) => setUploadDraft((draft) => ({ ...draft, artistName: event.target.value }))} placeholder="Your stage name" required maxLength={100} /></label>
                  <label>Release type<select value={uploadReleaseType} onChange={(event) => { setUploadReleaseType(event.target.value as "SINGLE" | "ALBUM"); setUploadFiles([]); }}><option value="SINGLE">Single</option><option value="ALBUM">Album</option></select></label>
                  {uploadReleaseType === "SINGLE"
                    ? <label className="wizard-field-wide">Track title<input value={uploadDraft.title} onChange={(event) => setUploadDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Give it a name" required maxLength={100} /></label>
                    : <label className="wizard-field-wide">Album title<input value={uploadDraft.albumTitle} onChange={(event) => setUploadDraft((draft) => ({ ...draft, albumTitle: event.target.value }))} placeholder="Name this album" required maxLength={100} /></label>}
                  <label className="wizard-field-wide">Genre<select value={uploadDraft.genre} onChange={(event) => setUploadDraft((draft) => ({ ...draft, genre: event.target.value }))} required>{musicGenres.map((genre) => <option key={genre}>{genre}</option>)}</select></label>
                  <label className="wizard-field-wide"><span className="wizard-label-heading">Release description <span className="wizard-optional">OPTIONAL</span></span><textarea value={uploadDraft.releaseDescription} onChange={(event) => setUploadDraft((draft) => ({ ...draft, releaseDescription: event.target.value }))} placeholder="A short introduction to this release" maxLength={500} rows={3} /></label>
                </div>
              </div>}
              {uploadStep === 1 && <div className="wizard-stage" key="upload-media">
                <div className="wizard-stage-heading"><span>STEP 2 OF 3</span><h3>Give it a sound and a look</h3><p>{uploadReleaseType === "ALBUM" ? "Add up to 12 audio files and one cover for the whole album." : "Choose the audio and artwork for your single."}</p></div>
                <div className="wizard-media-grid">
                  <div className="wizard-artwork-column">
                    <div className={`wizard-artwork-preview${uploadCoverPreview ? " has-artwork" : ""}`} role={uploadCoverPreview ? "img" : undefined} aria-label={uploadCoverPreview ? "Selected release cover preview" : undefined} style={uploadCoverPreview ? { backgroundImage: `url("${uploadCoverPreview}")` } : undefined}>
                      {!uploadCoverPreview && <div><ImagePlus size={27} /><span>Your cover preview</span><small>Square artwork looks best</small></div>}
                    </div>
                    <label className="wizard-file-picker">
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required={!uploadCoverFile} onChange={(event) => { setUploadCoverFile(event.currentTarget.files?.[0] ?? null); setError(""); }} />
                      <ImagePlus size={16} /><span><strong>{uploadCoverFile ? "Change cover artwork" : "Choose cover artwork"}</strong><small>{uploadCoverFile ? uploadCoverFile.name : "JPG, PNG or WebP · up to 5 MB"}</small></span><ArrowRight size={15} />
                    </label>
                  </div>
                  <div className="wizard-upload-column">
                    <label className="wizard-file-drop">
                      <input type="file" accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*" multiple={uploadReleaseType === "ALBUM"} required={!uploadFiles.length} onChange={(event) => { setUploadFiles(Array.from(event.currentTarget.files ?? [])); setError(""); }} />
                      <span className="wizard-file-icon"><FileAudio2 size={20} /></span>
                      <strong>{uploadFiles.length ? `${uploadFiles.length} audio file${uploadFiles.length === 1 ? "" : "s"} selected` : uploadReleaseType === "ALBUM" ? "Choose album tracks" : "Choose your audio file"}</strong>
                      <small>{uploadReleaseType === "ALBUM" ? "Up to 12 tracks · names come from file names" : "MP3, WAV, OGG, M4A or AAC · up to 30 MB"}</small>
                      <span className="wizard-file-action">Browse files</span>
                    </label>
                    {uploadFiles.length > 0 && <ul className="wizard-file-list">{uploadFiles.slice(0, 5).map((file, index) => <li key={`${file.name}-${index}`}><FileAudio2 size={14} /><span>{file.name}</span><small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small></li>)}{uploadFiles.length > 5 && <li className="wizard-file-more">+ {uploadFiles.length - 5} more tracks</li>}</ul>}
                  </div>
                </div>
              </div>}
              {uploadStep === 2 && <div className="wizard-stage" key="upload-review">
                <div className="wizard-stage-heading"><span>STEP 3 OF 3</span><h3>Ready for the world?</h3><p>Take one last look. You can go back and change anything before publishing.</p></div>
                <div className="wizard-review-card">
                  <div className="wizard-review-cover" role="img" aria-label="Release cover preview" style={{ backgroundImage: uploadCoverPreview ? `url("${uploadCoverPreview}")` : undefined }}>
                    {!uploadCoverPreview && <ImagePlus size={24} />}
                  </div>
                  <div className="wizard-review-copy">
                    <span className="wizard-review-tag"><Music2 size={13} /> {uploadReleaseType === "ALBUM" ? "ALBUM" : "SINGLE"} · {uploadDraft.genre}</span>
                    <h4>{uploadReleaseType === "ALBUM" ? uploadDraft.albumTitle || "Untitled album" : uploadDraft.title || "Untitled track"}</h4>
                    <p>by {uploadDraft.artistName || "Artist name"}</p>
                    {uploadDraft.releaseDescription && <p className="wizard-review-description">{uploadDraft.releaseDescription}</p>}
                    <div className="wizard-review-meta"><span><FileAudio2 size={14} /> {uploadFiles.length} track{uploadFiles.length === 1 ? "" : "s"}</span><span><ImagePlus size={14} /> Cover artwork ready</span></div>
                  </div>
                </div>
              </div>}
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="wizard-actions">
                {uploadStep > 0 && <button className="wizard-back" type="button" onClick={() => { setError(""); setUploadStep((step) => Math.max(step - 1, 0)); }}><ArrowLeft size={15} /> Back</button>}
                {uploadStep < 2
                  ? <button className="form-submit wizard-next" type="button" onClick={advanceUploadStep}>Continue <ArrowRight size={15} /></button>
                  : <button className="form-submit wizard-next" type="submit" disabled={busy}>{busy ? "Putting it together..." : uploadReleaseType === "ALBUM" ? "Publish album" : "Publish single"} <Upload size={15} /></button>}
              </div>
            </form>
          </> : modal === "checkout" && checkoutEvent ? <>
            <div className="modal-logo"><Ticket size={21} /></div>
            <span className="section-kicker">TICKET CHECKOUT</span><h2 id="modal-heading">{checkoutEvent.title}</h2><p className="modal-subtitle">{formatDate(checkoutEvent.startsAt)} · {checkoutEvent.venue}, {checkoutEvent.city}</p>
            <form className="modal-form checkout-form" onSubmit={(event) => void purchaseTickets(event)}>
              <label>Ticket type<select value={selectedTicketCategoryId} onChange={(event) => setSelectedTicketCategoryId(event.target.value)} required>{checkoutEvent.ticketCategories.map((category) => <option key={category.id} value={category.id} disabled={category.capacity <= category.ticketsSold}>{category.name} · {formatPrice(category.priceCents)}{category.capacity <= category.ticketsSold ? " · Sold out" : ""}</option>)}</select></label>
              <label>Number of tickets<input type="number" min="1" max="10" value={ticketQuantity} onChange={(event) => setTicketQuantity(Math.min(10, Math.max(1, Number(event.target.value))))} required /></label>
              <div className="checkout-price-breakdown">
                <span>Ticket subtotal <strong>{formatPrice((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity)}</strong></span>
                <span>Wiloplay service fee (10%) <strong>{formatPrice(platformFeeCents((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity))}</strong></span>
                <span className="checkout-total">{paymentMode === "demo" ? "Demo total (not charged)" : "Exact transfer amount"} <strong>{formatPrice((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity + platformFeeCents((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity))}</strong></span>
              </div>
              {paymentMode === "demo" ? <div className="payment-option selected demo-payment-option"><CreditCard size={17} /><span><strong>Demo checkout · no money taken</strong><small>Creates clearly marked test tickets. No bank transfer or Paystack request is made.</small></span></div>
                : paymentMode === "paystack" ? <div className="payment-option selected"><CreditCard size={17} /><span><strong>Bank transfer with Paystack</strong><small>Get a unique virtual account for this order. Pay from any supported Nigerian bank.</small></span></div>
                  : <div className="payment-option"><CreditCard size={17} /><span><strong>Payment options unavailable</strong><small>{paymentModeError || "Checking the configured checkout mode..."}</small></span></div>}
              <p className="demo-payment-note">{paymentMode === "demo" ? "Demo mode only: no real payment is processed and no ticket email is sent." : "Your tickets are issued only after Paystack verifies the exact transfer amount."}</p>
              {paymentModeError && <div className="form-error" role="alert">{paymentModeError}</div>}
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="form-submit" disabled={busy || !paymentMode || Boolean(paymentModeError) || !selectedCheckoutCategory || selectedCheckoutCategory.capacity <= selectedCheckoutCategory.ticketsSold}>{busy ? paymentMode === "demo" ? "Creating demo tickets..." : "Preparing secure transfer..." : paymentMode === "demo" ? "Create demo tickets" : `Get transfer details · ${formatPrice((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity + platformFeeCents((selectedCheckoutCategory?.priceCents ?? 0) * ticketQuantity))} `}<ArrowRight size={15} /></button>
            </form>
          </> : modal === "purchase-result" && purchaseResult ? <>
            <div className="modal-logo"><QrCode size={21} /></div>
            <span className="section-kicker">{purchaseResult.paymentMethod === "DEMO" ? "DEMO BOOKING · NO MONEY TAKEN" : purchaseResult.paymentStatus === "PAID" ? "YOU'RE ON THE LIST" : "BOOKING RECEIVED"}</span><h2 id="modal-heading">{purchaseResult.paymentMethod === "DEMO" ? "Your demo tickets are ready." : purchaseResult.paymentStatus === "PAID" ? "Your tickets are ready." : "Transfer pending."}</h2>
            <p className="modal-subtitle">{purchaseResult.event.title} · Payment reference <code>{purchaseResult.paymentReference ?? purchaseResult.id}</code></p>
            {purchaseResult.paymentStatus === "PENDING" ? <div className="transfer-instructions"><strong>Transfer exactly {formatPrice(purchaseResult.totalCents)}</strong><p>Bank: {purchaseResult.transferBankName || "Preparing account"}<br />Account number: {purchaseResult.transferAccountNumber || "Preparing account"}<br />Account name: {purchaseResult.transferAccountName || "Preparing account"}<br />Payment reference: {purchaseResult.paymentReference || purchaseResult.id}</p><small>Tickets are issued after Paystack verifies the payment. Do not upload a receipt or send money to an artist-provided account.</small></div>
              : <div className="qr-ticket-list">{purchaseResult.tickets.map((ticket) => <div className="qr-ticket" key={ticket.id}><a href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`}><img src={ticket.qrDataUrl} alt={`Ticket QR ${ticket.code}`} /></a><div><strong>Ticket code</strong><code>{ticket.code}</code><span>Show this code at the event entrance.</span><a className="ticket-download" href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`}><Download size={13} /> Download QR</a></div></div>)}</div>}
            <p className={purchaseResult.emailSent ? "check-in-success" : "email-delivery-note"} role="status">{purchaseResult.emailSent ? `QR tickets were emailed to ${user?.email}.` : purchaseResult.emailMessage}</p>
            <button className="form-submit" onClick={() => { setModal(null); setPurchaseResult(null); document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); }}>View my tickets <QrCode size={16} /></button>
          </> : <>
            <div className="modal-logo"><CalendarDays size={21} /></div>
            <span className="section-kicker">BRING YOUR PEOPLE TOGETHER</span><h2 id="modal-heading">Put on a show.</h2><p className="modal-subtitle">Create a listing and let people find your next live night.</p>
            <form className="modal-form wizard-form" ref={eventFormRef} onSubmit={(event) => void createEvent(event)}>
              <WizardProgress steps={["Show details", "Tickets", "Preview"]} activeStep={eventStep} />
              {eventStep === 0 && <div className="wizard-stage" key="event-details">
                <div className="wizard-stage-heading"><span>STEP 1 OF 3</span><h3>Set the scene</h3><p>Give people the details they need to make it a night out.</p></div>
                <div className="wizard-field-grid">
                  <label className="wizard-field-wide">Show name<input value={eventDraft.title} onChange={(event) => setEventDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="An evening with..." required maxLength={100} /></label>
                  <label>Venue<input value={eventDraft.venue} onChange={(event) => setEventDraft((draft) => ({ ...draft, venue: event.target.value }))} placeholder="The good room" required maxLength={100} /></label>
                  <label>City<input value={eventDraft.city} onChange={(event) => setEventDraft((draft) => ({ ...draft, city: event.target.value }))} placeholder="Lagos" required maxLength={80} /></label>
                  <label className="wizard-field-wide">Date &amp; time<input value={eventDraft.startsAt} onChange={(event) => setEventDraft((draft) => ({ ...draft, startsAt: event.target.value }))} type="datetime-local" required min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} /></label>
                </div>
              </div>}
              {eventStep === 1 && <div className="wizard-stage" key="event-tickets">
                <div className="wizard-stage-heading"><span>STEP 2 OF 3</span><h3>Make room for your people</h3><p>Set the ticket options and capacity for your show. You can add up to 10 categories.</p></div>
                <div className="wizard-category-list">
                  {ticketCategoryDrafts.map((category, index) => <div className="ticket-category-editor wizard-category-editor" key={index}>
                    <label>Category<input value={category.name} maxLength={40} placeholder={index === 0 ? "Regular" : "VIP"} required onChange={(event) => setTicketCategoryDrafts((old) => old.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></label>
                    <label>Price (NGN)<input type="number" min="0" max="1000000" step="1" value={category.price} required onChange={(event) => setTicketCategoryDrafts((old) => old.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} /></label>
                    <label>Tickets<input type="number" min="1" max="100000" value={category.capacity} required onChange={(event) => setTicketCategoryDrafts((old) => old.map((item, itemIndex) => itemIndex === index ? { ...item, capacity: event.target.value } : item))} /></label>
                    {ticketCategoryDrafts.length > 1 && <button className="remove-category" type="button" aria-label={`Remove ${category.name} category`} onClick={() => setTicketCategoryDrafts((old) => old.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button>}
                  </div>)}
                </div>
                <div className="wizard-category-footer"><button className="scanner-button" type="button" disabled={ticketCategoryDrafts.length >= 10} onClick={() => setTicketCategoryDrafts((old) => [...old, { name: "", price: "", capacity: "50" }])}><Plus size={14} /> Add ticket category</button><span>{ticketCategoryDrafts.length} of 10 categories</span></div>
              </div>}
              {eventStep === 2 && <div className="wizard-stage" key="event-preview">
                <div className="wizard-stage-heading"><span>STEP 3 OF 3</span><h3>Make it look like a night to remember</h3><p>Add an optional event image and preview the listing before it goes live.</p></div>
                <div className="event-preview-layout">
                  <div className="event-preview-card">
                    <div className="event-preview-art" style={eventCoverPreview ? { backgroundImage: `linear-gradient(180deg,transparent 35%,rgba(0,0,0,.78)),url("${eventCoverPreview}")` } : undefined}>
                      {!eventCoverPreview && <div className="event-preview-placeholder"><ImagePlus size={26} /><span>Your event artwork</span></div>}
                      <span className="event-preview-date"><strong>{eventDraft.startsAt ? new Date(eventDraft.startsAt).getDate() : "—"}</strong><small>{eventDraft.startsAt ? new Date(eventDraft.startsAt).toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "DATE"}</small></span>
                      <span className="event-preview-price">{ticketCategoryDrafts.length ? `From ${formatPrice(Math.round(Number(ticketCategoryDrafts[0].price || 0) * 100))}` : "Tickets"}</span>
                    </div>
                    <div className="event-preview-details"><div className="event-preview-info"><span><CalendarDays size={13} /> {eventDraft.startsAt ? new Date(eventDraft.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Date to be announced"}</span><span><Clock3 size={13} /> {eventDraft.startsAt ? new Date(eventDraft.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Time to be announced"}</span></div><h4>{eventDraft.title || "Your show name"}</h4><p><MapPin size={14} /> {eventDraft.venue || "Venue"}, {eventDraft.city || "City"} · {user?.name ?? "Artist"}</p><div className="event-preview-categories">{ticketCategoryDrafts.map((category, index) => <span key={`${category.name}-${index}`}>{category.name || `Category ${index + 1}`} · {formatPrice(Math.round(Number(category.price || 0) * 100))}</span>)}</div></div>
                  </div>
                  <label className="wizard-file-drop event-cover-drop">
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => { setEventCoverFile(event.currentTarget.files?.[0] ?? null); setError(""); }} />
                    <span className="wizard-file-icon"><ImagePlus size={20} /></span>
                    <strong>{eventCoverFile ? "Change event image" : "Add an event image"}</strong>
                    <small>{eventCoverFile ? eventCoverFile.name : "Optional · JPG, PNG or WebP · up to 5 MB"}</small>
                    <span className="wizard-file-action">{eventCoverFile ? "Choose another" : "Browse images"}</span>
                  </label>
                </div>
              </div>}
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="wizard-actions">
                {eventStep > 0 && <button className="wizard-back" type="button" onClick={() => { setError(""); setEventStep((step) => Math.max(step - 1, 0)); }}><ArrowLeft size={15} /> Back</button>}
                {eventStep < 2
                  ? <button className="form-submit wizard-next" type="button" onClick={advanceEventStep}>Continue <ArrowRight size={15} /></button>
                  : <button className="form-submit wizard-next" type="submit" disabled={busy}>{busy ? "Making it official..." : "Publish your show"} <Ticket size={15} /></button>}
              </div>
            </form>
          </>}
        </section>
      </div>}
    </main>
  );
}
