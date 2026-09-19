export type Role = "client" | "astrologer";
export type Duration = 30 | 45 | 60;
export type BookingStatus = "confirmed" | "active" | "completed";
export type CallStatus = "waiting" | "astrologer-joined" | "client-joined" | "active" | "unstable" | "ended";
export type Scenario = "normal" | "loading" | "error" | "empty" | "payment-failure";
export interface Client {
  id: string; name: string; email: string; mobile: string; language: string;
  birthDate?: string; birthTime?: string; birthPlace?: string;
  birthDetailsConsent?: boolean;
}
export interface Astrologer {
  id: string; name: string; title: string; specialty: string; expertise: string[];
  experience: number; languages: string[]; rating: number; consultations: number;
  gender: "Female" | "Male"; image: string; color: string; bio: string; style: string;
  prices: Record<Duration, number>; featured: boolean;
  reviews: { id: string; name: string; rating: number; text: string; topic: string }[];
}
export interface Window { day: number; start: string; end: string }
export interface Override { date: string; windows: { start: string; end: string }[] }
export interface Block { date: string; start: string; end: string }
export interface Schedule { astrologerId: string; windows: Window[]; overrides: Override[]; blocks: Block[] }
export interface Booking {
  id: string; astrologerId: string; clientId: string; sessionId: string;
  start: string; end: string; duration: Duration; price: number;
  status: BookingStatus; paymentStatus: "paid"; topic: string; astrologerName: string;
}
export interface Session {
  id: string; bookingId: string; status: CallStatus;
  startedAt?: string; endedAt?: string; rating?: number; feedback?: string;
  muted: boolean; cameraOff: boolean; speakerOff: boolean; sharing: boolean;
}
export interface ChatMessage {
  id: string; sessionId: string; sender: Role; text: string; timestamp: string;
  status: "sent" | "read" | "failed";
}
export interface Testimonial { id: string; name: string; city: string; text: string; topic: string }
export interface DemoState {
  version: 1; seedDate: string; now: number;
  astrologers: Astrologer[]; clients: Client[]; schedules: Schedule[];
  bookings: Booking[]; sessions: Session[]; messages: ChatMessage[]; testimonials: Testimonial[];
  clientId: string | null; astrologerId: string | null; scenario: Scenario;
}
export interface Slot { start: string; end: string; available: boolean; reason?: string }
export interface BookingInput { astrologerId: string; start: string; duration: Duration; topic?: string; requestId: string }
export interface DemoActions {
  login: (role: Role, name?: string, contact?: string) => void;
  logout: (role: Role) => void;
  updateClient: (patch: Partial<Client>) => void;
  updateAstrologer: (id: string, patch: Partial<Astrologer>) => void;
  saveSchedule: (schedule: Schedule) => void;
  book: (input: BookingInput) => Booking;
  join: (sessionId: string, demoNow?: boolean) => void;
  setCallStatus: (sessionId: string, status: CallStatus) => void;
  toggleControl: (sessionId: string, control: "muted" | "cameraOff" | "speakerOff" | "sharing") => void;
  endSession: (sessionId: string) => void;
  rateSession: (sessionId: string, rating: number, feedback: string) => void;
  sendMessage: (sessionId: string, text: string, sender?: Role) => void;
  replyMessage: (sessionId: string) => void;
  retryMessage: (messageId: string) => void;
  setScenario: (scenario: Scenario) => void;
  reset: () => void;
  clearError: () => void;
}
