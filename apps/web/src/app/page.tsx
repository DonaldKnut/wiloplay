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
  FileAudio2,
  Headphones,
  Heart,
  Home,
  ImagePlus,
  LogOut,
  Link2,
  MapPin,
  Menu,
  Mic2,
  Music2,
  QrCode,
  Pause,
  Play,
  Plus,
  Pencil,
  Search,
  Ticket,
  ScanLine,
  CalendarDays,
  Clock3,
  Trash2,
  Upload,
  Users,
  Volume2,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
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
  duration?: number;
  album?: string;
  albumTitle?: string | null;
  releaseDescription?: string | null;
  enhancedAudioUrl?: string | null;
  aiProductionStatus?: string | null;
  genre?: string;
  releaseType?: "SINGLE" | "ALBUM";
  deezerUrl?: string;
};

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
type Modal = "login" | "signup" | "email-verification" | "upload" | "event" | "checkout" | "purchase-result" | null;
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => {
  detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};

const formats: Track[][] = [
  [
    {
      id: "fallback-1",
      title: "Midnight City",
      artist: "M83",
      album: "Hurry Up, We're Dreaming",
      cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=400&h=400&fit=crop",
    },
    {
      id: "fallback-2",
      title: "Borderline",
      artist: "Tame Impala",
      album: "The Slow Rush",
      cover: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&h=400&fit=crop",
    },
    {
      id: "fallback-3",
      title: "Good Luck, Babe!",
      artist: "Chappell Roan",
      album: "Single",
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    },
    {
      id: "fallback-4",
      title: "Tadow",
      artist: "Masego & FKJ",
      album: "Lady Lady",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    },
    {
      id: "fallback-5",
      title: "Sunset Lover",
      artist: "Petit Biscuit",
      album: "Presence",
      cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=400&fit=crop",
    },
  ],
];

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
    throw new Error(body?.message ?? "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

function formatTime(seconds?: number) {
  if (!seconds) return "—:—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
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
  const [tracks, setTracks] = useState<Track[]>(formats[0]);
  const [chart, setChart] = useState<DeezerChart | null>(null);
  const [chartError, setChartError] = useState("");
  const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(null);
  const [loadingArtistId, setLoadingArtistId] = useState<number | null>(null);
  const [artistDetailsError, setArtistDetailsError] = useState("");
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
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
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [cityDraft, setCityDraft] = useState("");
  const [listenCity, setListenCity] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<
    "home" | "discovery" | "for-you" | "shows" | "my-tickets"
  >("home");
  const [modal, setModal] = useState<Modal>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "" });
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationExpiresInSeconds, setVerificationExpiresInSeconds] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [paymentModeError, setPaymentModeError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const artistDetailsRequestId = useRef(0);
  const countedListenTrackId = useRef<string | null>(null);
  const listenPlaybackId = useRef("");

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

  const searchTracks = useCallback(async (term: string) => {
    if (!term.trim()) {
      setTracks(formats[0]);
      setError("");
      return;
    }
    try {
      const results = await request<
        { id: number; title: string; artist: string; album: string; cover: string; preview?: string; duration: number; deezerUrl: string }[]
      >(`/deezer/search?q=${encodeURIComponent(term.trim())}`);
      setTracks(results.map((item) => ({ ...item, id: item.id, duration: Math.min(item.duration, 30) })));
      setError("");
    } catch {
      setError("Music search is unavailable. Check that the API is running.");
    }
  }, []);

  const loadChart = useCallback(async () => {
    try {
      const results = await request<DeezerChart>("/deezer/chart");
      setChart(results);
      setChartError("");
    } catch {
      setChartError("Deezer charts are unavailable right now. Please try again later.");
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
  }, [loadChart, loadEvents, loadUploads, searchTracks]);

  useEffect(() => {
    if (!token || !user) return;
    void loadMyTicketOrders();
    if (user.role === "ARTIST") {
      void loadArtistEvents();
      void loadArtistBankAccount();
      void loadArtistTracks();
      void request<AiConfiguration>("/tracks/ai/config", token).then(setAiConfiguration).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "AI tools could not be checked.");
      });
    }
  }, [loadArtistBankAccount, loadArtistEvents, loadArtistTracks, loadMyTicketOrders, token, user]);

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
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void searchTracks(value), 350);
  }

  function showMessage(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3800);
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
    setPurchaseResult(null);
    if (modal === "email-verification") {
      setAuthDraft((draft) => ({ ...draft, password: "" }));
      setVerificationCode("");
      if (token && !user?.emailVerifiedAt) logout();
    }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await request<AuthResponse>(
        `/auth/${authMode}`,
        null,
        { method: "POST", body: JSON.stringify(data) },
      );
      if ("verificationRequired" in result) {
        setVerificationEmail(result.email);
        setVerificationExpiresInSeconds(result.expiresInSeconds);
        setVerificationCode("");
        setModal("email-verification");
        showMessage(result.sent
          ? `A verification code was sent to ${result.email}.`
          : `A verification code was already sent to ${result.email}.`);
        return;
      }
      establishSession(result, `You're in, ${result.user.name.split(" ")[0]}. Welcome to Wiloplay.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
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
    setVerificationCode("");
    setModal(checkoutEvent ? "checkout" : null);
    showMessage(message);
  }

  async function resendEmailVerification() {
    if (!authDraft.email || !authDraft.password) {
      if (token) {
        setBusy(true);
        setError("");
        try {
          const result = await request<EmailVerificationChallenge | EmailVerificationStatus | AuthSession>(
            "/auth/request-email-verification",
            token,
            { method: "POST" },
          );
          if ("verificationRequired" in result) {
            setVerificationEmail(result.email);
            setVerificationExpiresInSeconds(result.expiresInSeconds);
            setVerificationCode("");
            showMessage(result.sent
              ? `A new verification code was sent to ${result.email}.`
              : `A code was already sent to ${result.email}.`);
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
          setError(reason instanceof Error ? reason.message : "Could not resend the verification code.");
        } finally {
          setBusy(false);
        }
        return;
      }

      setAuthMode("login");
      setAuthDraft((draft) => ({ name: "", email: verificationEmail, password: "" }));
      setModal("login");
      setError("Sign in again to request a new verification code.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await request<AuthResponse>(
        "/auth/login",
        null,
        {
          method: "POST",
          body: JSON.stringify({ email: authDraft.email, password: authDraft.password }),
        },
      );
      if ("verificationRequired" in result) {
        setVerificationEmail(result.email);
        setVerificationExpiresInSeconds(result.expiresInSeconds);
        showMessage(result.sent
          ? `A new verification code was sent to ${result.email}.`
          : `A code was already sent to ${result.email}.`);
      } else {
        establishSession(result, "Your email is verified. Welcome to Wiloplay.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not resend the verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<AuthSession>(
        "/auth/verify-email",
        null,
        {
          method: "POST",
          body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
        },
      );
      establishSession(result, "Your email is verified. Welcome to Wiloplay.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not verify your email.");
    } finally {
      setBusy(false);
    }
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

  function toggleTrack(track: Track) {
    if (!track.preview && !track.audioUrl) {
      showMessage("Search Deezer for a song with an available preview to listen.");
      return;
    }
    if (current?.id === track.id && current.audioUrl === track.audioUrl) {
      setPlaying((isPlaying) => !isPlaying);
      return;
    }
    setCurrent(track);
    setPlaying(true);
  }

  const shownTracks = [...uploadedTracks, ...tracks];
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
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a href="#" className="brand" aria-label="Wiloplay home">
          <span className="brand-mark"><AudioLines size={21} strokeWidth={2.2} /></span>
          <span>wiloplay<span className="brand-dot">.</span></span>
        </a>
        <div className="nav-caption">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className={`nav-link ${activeNav === "home" ? "active" : ""}`} aria-current={activeNav === "home" ? "location" : undefined} href="#home" onClick={() => setMobileNav(false)}><Home size={17} />Home</a>
          <button className={`nav-link ${activeNav === "discovery" ? "active" : ""}`} aria-current={activeNav === "discovery" ? "location" : undefined} onClick={() => { setActiveNav("discovery"); setSearchOpen(true); setMobileNav(false); document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" }); }}><Compass size={17} />Discover</button>
          <a className={`nav-link ${activeNav === "for-you" ? "active" : ""}`} aria-current={activeNav === "for-you" ? "location" : undefined} href="#for-you" onClick={() => setMobileNav(false)}><Heart size={17} />Made for you</a>
          <a className={`nav-link ${activeNav === "shows" ? "active" : ""}`} aria-current={activeNav === "shows" ? "location" : undefined} href="#shows" onClick={() => setMobileNav(false)}><Ticket size={17} />Live shows<span className="nav-new">NEW</span></a>
          <a className={`nav-link ${activeNav === "my-tickets" ? "active" : ""}`} aria-current={activeNav === "my-tickets" ? "location" : undefined} href="#my-tickets" onClick={() => setMobileNav(false)}><QrCode size={17} />My tickets</a>
        </nav>
        <div className="sidebar-rule" />
        <div className="nav-caption">YOUR SOUND</div>
        <button className="library-link" onClick={() => { setAuthMode("login"); setModal("login"); }}><Plus size={16} />Create a playlist</button>
        <div className="playlist-empty">Your music, your mood.<br />Come back here for the good stuff.</div>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-icon"><Mic2 size={18} /></div>
            <div><strong>Made something?</strong><span>Your listeners are out there.</span></div>
          </div>
          <button className="sidebar-artist" onClick={() => user?.role === "ARTIST" ? openUploadWizard() : user ? void becomeArtist() : (setAuthMode("signup"), setModal("signup"))}>
            Start as an artist <ArrowRight size={14} />
          </button>
          <div className="sidebar-footer">A little more music. A lot more you.</div>
        </div>
      </aside>

      <section className="main-panel" id="home">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button>
            <button className="icon-btn top-arrow" aria-label="Go back" onClick={() => window.history.back()}><ArrowLeft size={17} /></button>
            <button className="icon-btn top-arrow" aria-label="Go forward" onClick={() => window.history.forward()}><ArrowRight size={17} /></button>
            <form className={`search-box ${searchOpen ? "search-focused" : ""}`} onSubmit={(event) => { event.preventDefault(); void searchTracks(query); }}>
              <Search size={16} />
              <input aria-label="Search tracks and artists" placeholder="Songs, artists, that one feeling..." value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => onSearchChange(event.target.value)} />
              {query && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => { setQuery(""); void searchTracks(""); }}><X size={14} /></button>}
            </form>
          </div>
          <div className="topbar-actions">
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
              <div className="hero-actions"><a className="hero-cta" href="#discovery">Find your sound <ArrowRight size={16} /></a><button className="hero-secondary" onClick={() => { setAuthMode("signup"); setModal("signup"); }}>I&apos;m an artist <ArrowDownToLine size={15} /></button></div>
              <div className="hero-proof"><span className="proof-avatars"><i>J</i><i>M</i><i>A</i><i>+</i></span><span>Good music. Good people. <strong>That&apos;s it.</strong></span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-image hero-image-back" />
              <div className="hero-image hero-image-main" />
              <div className="vinyl"><div className="vinyl-center"><AudioLines size={22} /></div></div>
              <div className="floating-player"><span className="floating-cover" /><span className="floating-track"><strong>soft hours</strong><small>vol. 04 · your mix</small></span><span className="floating-bars"><i /><i /><i /><i /><i /></span></div>
              <span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✴</span>
            </div>
            <div className="hero-bottom"><span>01 — YOUR DAILY RESET</span><span>MADE FOR THE MOMENT YOU&apos;RE IN <span className="hero-bottom-dash">↗</span></span></div>
          </section>

          <section className="section discovery-section" id="discovery">
            <div className="section-heading">
              <div><span className="section-kicker">A GOOD PLACE TO START</span><h2>{query ? "Your search, your sound." : "What are we feeling?"}</h2><p>{query ? `Showing the good stuff for “${query}”` : <>A little moodboard for wherever your head&apos;s at.</>}</p></div>
              <button className="text-link" onClick={() => { setSearchOpen(true); document.querySelector<HTMLInputElement>(".search-box input")?.focus(); }}>Search something <ArrowRight size={15} /></button>
            </div>
            <div className="mood-grid" id="for-you">{moods.map((mood, index) => (
              <button className="mood-card" key={mood.label} style={{ "--mood-color": mood.color, "--mood-image": `url(https://images.unsplash.com/${mood.art}?w=850&h=420&fit=crop)` } as React.CSSProperties} onClick={() => { setQuery(mood.query); void searchTracks(mood.query); document.getElementById("track-list")?.scrollIntoView({ behavior: "smooth" }); }}>
                <div className="mood-art" /><span className="mood-number">0{index + 1} / MOOD</span><span className="mood-card-copy"><strong>{mood.label}</strong><small>{mood.sub}</small></span><span className="mood-play"><Play size={15} fill="currentColor" /></span>
              </button>
            ))}</div>
          </section>

          <section className="section top-charts-section" id="top-charts">
            <div className="section-heading">
              <div><span className="section-kicker">LISTENING RIGHT NOW</span><h2>WiloPlay charts.</h2><p>The tracks, artists, and albums making waves.</p></div>
              <a className="text-link" href="https://www.deezer.com/channels/explore" target="_blank" rel="noreferrer">Explore on Deezer <ArrowRight size={15} /></a>
            </div>
            {chartError && <div className="inline-error" role="status">{chartError}</div>}
            {!chart && !chartError && <p className="chart-loading" role="status">Loading Deezer charts…</p>}
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

          <section className="section tracks-section" id="track-list">
            <div className="section-heading compact-heading">
              <div><span className="section-kicker">{query ? "A FEW GOOD MATCHES" : "THE FIRST SONG IS THE HARDEST"}</span><h2>{query ? "For the curious." : "Good things, on repeat."}</h2></div>
              <span className="source-note"><Disc3 size={14} /> Deezer previews · random next</span>
            </div>
            {error && <div className="inline-error" role="status">{error}</div>}
            <div className="track-list">
              {shownTracks.length ? shownTracks.slice(0, 8).map((track, index) => {
                const isCurrent = current?.id === track.id;
                return <div className={`track-row ${isCurrent ? "track-current" : ""}`} key={track.id}>
                  <span className="track-index">{isCurrent && playing ? <AudioLines size={15} /> : String(index + 1).padStart(2, "0")}</span>
                  <button className="track-art-button" aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${track.title}`} onClick={() => toggleTrack(track)}><Cover src={track.cover} alt={`${track.title} cover`} /><span className="track-overlay">{isCurrent && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</span></button>
                  <div className="track-title-with-profile">
                    <button className="track-title" onClick={() => toggleTrack(track)}><strong>{track.title}</strong><span>{track.artist}</span></button>
                    {track.artistProfileId && <a className="track-profile-link" href={`/artist/${encodeURIComponent(track.artistProfileId)}`} aria-label={`View ${track.artist} artist profile`} title={`View ${track.artist} artist profile`}><Users size={13} /><span>Profile</span></a>}
                  </div>
                  <span className="track-album">{track.album ?? "Your next favorite"}</span>
                  <button className={`track-heart ${isCurrent ? "hearted" : ""}`} aria-label={`Add ${track.title} to favorites`} onClick={() => showMessage("Saved to your favorites. Good choice.")}><Heart size={16} /></button>
                  <span className="track-duration">{formatTime(track.duration)}</span>
                </div>;
              }) : <div className="empty-search"><Search size={18} />Nothing found just yet. Try another search?</div>}
            </div>
            <button className="browse-more" onClick={() => { setSearchOpen(true); document.querySelector<HTMLInputElement>(".search-box input")?.focus(); }}>Keep exploring <ArrowRight size={15} /></button>
          </section>

          <section className="artist-banner">
            <div className="artist-banner-art"><span>✳</span><span>♫</span><span>✴</span></div>
            <div className="artist-banner-copy"><span className="section-kicker">FOR THE ONES MAKING THE MUSIC</span><h2>Your music deserves<br />to be <em>out there.</em></h2><p>Share your tracks, put on a show, and find the people who get it.</p><button className="banner-cta" onClick={() => user?.role === "ARTIST" ? openUploadWizard() : user ? void becomeArtist() : (setAuthMode("signup"), setModal("signup"))}>{user?.role === "ARTIST" ? "Upload your music" : "Make your artist account"} <ArrowRight size={15} /></button></div>
            <span className="artist-banner-caption">YOUR NEXT CHAPTER STARTS HERE — 02</span>
          </section>

          <section className="section events-section" id="shows">
            <div className="section-heading">
              <div><span className="section-kicker">SOME THINGS SOUND BETTER TOGETHER</span><h2>Meet us at the show.</h2><p>Real rooms. Real music. A night you&apos;ll actually remember.</p></div>
              <button className="text-link" onClick={() => user?.role === "ARTIST" ? openEventWizard() : user ? showMessage("Become an artist to put your next show on the map.") : (setAuthMode("signup"), setModal("signup"))}>Put on a show <Plus size={15} /></button>
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

          <footer className="footer"><a href="#" className="brand footer-brand"><span className="brand-mark"><AudioLines size={18} /></span><span>wiloplay<span className="brand-dot">.</span></span></a><span>Made for music people. Wherever you find them.</span><div><a href="#discovery">Discover</a><a href="#shows">Live shows</a><button onClick={() => showMessage("More good things are on the way.")}>About us</button></div></footer>
        </div>
      </section>

      <div className="player" aria-label="Music player">
        <audio ref={audioRef} onTimeUpdate={(event) => { setElapsed(event.currentTarget.currentTime); recordQualifiedListen(event.currentTarget); }} onDurationChange={(event) => { if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration); }} onEnded={() => {
          const candidates = shownTracks.filter((track) =>
            (track.preview || track.audioUrl) && track.id !== current?.id,
          );
          if (!candidates.length) {
            listenPlaybackId.current = crypto.randomUUID();
            countedListenTrackId.current = null;
            setPlaying(false);
            return;
          }
          setCurrent(candidates[Math.floor(Math.random() * candidates.length)]);
        }} onError={() => { if (current && playing) { setPlaying(false); showMessage("This preview isn't available right now."); } }} />
        <div className="player-track">
          {current ? <><Cover src={current.cover} alt="" className="player-cover" /><div className="player-track-info"><strong>{current.title}</strong><span>{current.artist}</span></div><button className="player-heart" aria-label="Like track" onClick={() => showMessage("Saved to your favorites.")}><Heart size={15} /></button></> : <><div className="player-placeholder"><Headphones size={17} /></div><div className="player-track-info"><strong>Your next favorite is out there.</strong><span>Press play and see where you end up.</span></div></>}
        </div>
        <div className="player-center"><div className="player-controls"><button className="player-minor" aria-label="Previous track" onClick={() => { if (shownTracks.length) toggleTrack(shownTracks[0]); }}><ArrowLeft size={14} /></button><button className="player-play" aria-label={playing ? "Pause" : "Play"} onClick={() => current ? setPlaying(!playing) : shownTracks[0] && toggleTrack(shownTracks[0])}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><button className="player-minor" aria-label="Next track" onClick={() => { const index = shownTracks.findIndex((track) => track.id === current?.id); if (shownTracks.length) toggleTrack(shownTracks[(index + 1 + shownTracks.length) % shownTracks.length]); }}><ArrowRight size={14} /></button></div>        <div className="progress-row"><span>{formatTime(elapsed)}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${mediaDuration ? Math.min((elapsed / mediaDuration) * 100, 100) : 0}%` }} /></div><span>{formatTime(mediaDuration || current?.duration)}</span></div></div>
        <div className="player-right"><details className="location-sharing-control"><summary><MapPin size={14} /><span>{listenCity ? `City: ${listenCity}` : "Share city"}</span></summary><form onSubmit={saveListenerCity}><label htmlFor="listener-city">Optional city for trend analytics</label><input id="listener-city" value={cityDraft} maxLength={80} onChange={(event) => setCityDraft(event.target.value)} placeholder="e.g. Lagos" /><small>Only your city is shared, and artist profiles show aggregated totals. No GPS is used.</small><button>{listenCity ? "Update city" : "Share city"}</button>{listenCity && <button type="button" className="city-sharing-stop" onClick={() => void stopCitySharing()}>Stop sharing</button>}</form></details><Volume2 size={16} /><div className="volume-track"><div /></div><button className="queue-btn" aria-label="Open queue" onClick={() => showMessage("You're already listening to all the good stuff.")}><Menu size={18} /></button></div>
      </div>

      {notice && <div className="toast" role="status"><span><Check size={15} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}

      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <section key={modal} className={`modal-card${modal === "upload" || modal === "event" ? " wizard-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-heading">
          <button className="modal-close" aria-label="Close dialog" onClick={closeModal}><X size={18} /></button>
          <div className="modal-logo"><AudioLines size={21} /></div>
          {modal === "login" || modal === "signup" ? <>
            <span className="section-kicker">YOUR PEOPLE ARE HERE</span><h2 id="modal-heading">{authMode === "signup" ? "Find your people." : "Good to have you back."}</h2><p className="modal-subtitle">{authMode === "signup" ? "One account. Every song that feels like you." : "Pick up right where the music left off."}</p>
            <form key={`auth-${authMode}`} className="modal-form" onSubmit={(event) => void handleAuth(event)}>
              {authMode === "signup" && <label>Your name<input name="name" autoComplete="name" placeholder="How should we call you?" value={authDraft.name} onChange={(event) => setAuthDraft((draft) => ({ ...draft, name: event.target.value }))} required minLength={2} maxLength={60} /></label>}
              <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@somewhere.com" value={authDraft.email} onChange={(event) => setAuthDraft((draft) => ({ ...draft, email: event.target.value }))} required /></label>
              <label>Password<input name="password" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" value={authDraft.password} onChange={(event) => setAuthDraft((draft) => ({ ...draft, password: event.target.value }))} minLength={8} required /></label>
              {error && <div className="form-error" role="alert">{error}</div>}<button className="form-submit" disabled={busy}>{busy ? "One second..." : authMode === "signup" ? "Create your account" : "Log in"} <ArrowRight size={15} /></button>
            </form>
            <p className="modal-switch">{authMode === "signup" ? "Already found us?" : "New around here?"} <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthDraft((draft) => ({ ...draft, password: "" })); setError(""); }}>{authMode === "signup" ? "Log in" : "Make an account"}</button></p>
          </> : modal === "email-verification" ? <>
            <span className="section-kicker">CHECK YOUR INBOX</span><h2 id="modal-heading">Verify your email.</h2>
            <p className="modal-subtitle">We sent a six-digit code to <strong>{verificationEmail}</strong>. It expires in {Math.max(1, Math.ceil(verificationExpiresInSeconds / 60))} minutes.</p>
            <form className="modal-form" onSubmit={(event) => void verifyEmail(event)}>
              <label>Verification code<input className="email-verification-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="form-submit" disabled={busy || verificationCode.length !== 6}>{busy ? "Verifying..." : "Verify email"} <ArrowRight size={15} /></button>
            </form>
            <p className="modal-switch">Didn&apos;t get a code? <button type="button" disabled={busy} onClick={() => void resendEmailVerification()}>Resend code</button></p>
          </> : modal === "upload" ? <>
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
            <span className="section-kicker">{purchaseResult.paymentMethod === "DEMO" ? "DEMO BOOKING · NO MONEY TAKEN" : purchaseResult.paymentStatus === "PAID" ? "YOU'RE ON THE LIST" : "BOOKING RECEIVED"}</span><h2 id="modal-heading">{purchaseResult.paymentMethod === "DEMO" ? "Your demo tickets are ready." : purchaseResult.paymentStatus === "PAID" ? "Your tickets are ready." : "Transfer pending."}</h2>
            <p className="modal-subtitle">{purchaseResult.event.title} · Payment reference <code>{purchaseResult.paymentReference ?? purchaseResult.id}</code></p>
            {purchaseResult.paymentStatus === "PENDING" ? <div className="transfer-instructions"><strong>Transfer exactly {formatPrice(purchaseResult.totalCents)}</strong><p>Bank: {purchaseResult.transferBankName || "Preparing account"}<br />Account number: {purchaseResult.transferAccountNumber || "Preparing account"}<br />Account name: {purchaseResult.transferAccountName || "Preparing account"}<br />Payment reference: {purchaseResult.paymentReference || purchaseResult.id}</p><small>Tickets are issued after Paystack verifies the payment. Do not upload a receipt or send money to an artist-provided account.</small></div>
              : <div className="qr-ticket-list">{purchaseResult.tickets.map((ticket) => <div className="qr-ticket" key={ticket.id}><a href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`}><img src={ticket.qrDataUrl} alt={`Ticket QR ${ticket.code}`} /></a><div><strong>Ticket code</strong><code>{ticket.code}</code><span>Show this code at the event entrance.</span><a className="ticket-download" href={ticket.qrDataUrl} download={`wiloplay-ticket-${ticket.code}.png`}><Download size={13} /> Download QR</a></div></div>)}</div>}
            <p className={purchaseResult.emailSent ? "check-in-success" : "email-delivery-note"} role="status">{purchaseResult.emailSent ? `QR tickets were emailed to ${user?.email}.` : purchaseResult.emailMessage}</p>
            <button className="form-submit" onClick={() => { setModal(null); setPurchaseResult(null); document.getElementById("my-tickets")?.scrollIntoView({ behavior: "smooth" }); }}>View my tickets <QrCode size={16} /></button>
          </> : <>
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
