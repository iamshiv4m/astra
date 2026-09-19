import { z } from "zod";
import { createAdvisors, createTestimonials } from "../data/advisors";
import type {
  Astrologer,
  Booking,
  BookingInput,
  CallStatus,
  Client,
  DemoState,
  Duration,
  Role,
  Schedule,
  Session,
  Slot,
} from "../types/domain";

const MINUTE = 60000;
const DAY = 86400000;
const TIME_ZONE = "Asia/Kolkata";
const durations = [30, 45, 60] as const;
const iso = (time: number) => new Date(time).toISOString();
function fail(message: string): never {
  throw new Error(message);
}

export function dateKey(value: number | string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (
      !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
    )
      fail("Enter a valid date.");
    return value;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) fail("Enter a valid date.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}

export function addDays(date: string, n: number): string {
  if (!Number.isInteger(n)) fail("Day offset must be an integer.");
  return dateKey(Date.parse(`${dateKey(date)}T12:00:00+05:30`) + n * DAY);
}

export function money(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

const asDate = (value: string | number) =>
  new Date(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+05:30` : value);
export function formatDate(value: string | number, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
    timeZone: TIME_ZONE,
  }).format(asDate(value));
}
export function formatTime(value: string | number): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE }).format(
    asDate(value)
  );
}

const at = (date: string, time: string) => Date.parse(`${date}T${time}:00+05:30`);
const overlaps = (a: number, b: number, c: number, d: number) => a < d && c < b;
const minuteOfDay = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const timeOfDay = (minute: number) =>
  `${Math.floor(minute / 60)
    .toString()
    .padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;

export function createSeed(date = dateKey(Date.now())): DemoState {
  const seedDate = dateKey(date);
  const astrologers = createAdvisors();
  const clients: Client[] = [
    {
      id: "shivam",
      name: "Shivam",
      email: "shivam@example.com",
      mobile: "9876543210",
      language: "English",
      birthDate: "1996-08-15",
      birthTime: "08:30",
      birthPlace: "New Delhi",
    },
    { id: "rahul", name: "Rahul", email: "rahul@example.com", mobile: "9876543211", language: "Hindi" },
    { id: "priya", name: "Priya", email: "priya@example.com", mobile: "9876543212", language: "English" },
    { id: "aman", name: "Aman", email: "aman@example.com", mobile: "9876543213", language: "English" },
  ];
  const bookings: Booking[] = Array.from({ length: 10 }, (_, i) => {
    const advisor = i < 5 ? astrologers[[0, 1, 2, 0, 0][i]] : astrologers[0];
    const duration: Duration = i === 1 ? 45 : i === 3 ? 60 : 30;
    const day = i < 5 ? addDays(seedDate, i - 6) : i === 9 ? addDays(seedDate, 1) : seedDate;
    const time = i < 5 ? "11:00" : ["10:00", "12:30", "16:00", "18:30", "11:00"][i - 5];
    const start = at(day, time);
    return {
      id: `booking-${i + 1}`,
      sessionId: `session-${i + 1}`,
      clientId:
        i < 5
          ? ["shivam", "shivam", "priya", "rahul", "shivam"][i]
          : ["rahul", "priya", "aman", "shivam", "shivam"][i - 5],
      astrologerId: advisor.id,
      astrologerName: advisor.name,
      duration,
      price: advisor.prices[duration],
      status: i < 5 ? "completed" : "confirmed",
      paymentStatus: "paid",
      start: iso(start),
      end: iso(start + duration * MINUTE),
      topic: ["Career direction", "Professional growth", "Relationships", "Life direction", "A new chapter"][i % 5],
    };
  });
  const sessions: Session[] = bookings.map((booking, i) => ({
    id: booking.sessionId,
    bookingId: booking.id,
    status: i < 5 ? "ended" : "waiting",
    muted: false,
    cameraOff: false,
    speakerOff: false,
    sharing: false,
    ...(i < 5
      ? {
          startedAt: booking.start,
          endedAt: booking.end,
          rating: i === 2 ? 4 : 5,
          feedback: "Thank you for a thoughtful conversation and useful perspective.",
        }
      : {}),
  }));
  const messages: DemoState["messages"] = [];
  for (let i = 0; i < 4; i++) {
    const texts = [
      "Welcome. What would you like to explore today?",
      "I would appreciate a fresh perspective on my next step.",
      "Let us start with what matters most to you.",
      "Thank you. That gives me something useful to reflect on.",
    ];
    texts.forEach((text, j) =>
      messages.push({
        id: `message-${messages.length + 1}`,
        sessionId: sessions[i].id,
        sender: j % 2 ? "client" : "astrologer",
        text,
        timestamp: iso(Date.parse(bookings[i].start) + j * 2 * MINUTE),
        status: "read",
      })
    );
  }
  [
    "Welcome, Shivam. I’m Ananya. This is a private simulated space for our conversation.",
    "Hello Ananya, I would like to discuss my career direction.",
    "Of course. If you are comfortable, could you share your birth date, time and place? An unknown birth time is fine.",
    "15 August 1996, 8:30 am, New Delhi. I’m weighing a career change.",
  ].forEach((text, i) =>
    messages.push({
      id: `message-${17 + i}`,
      sessionId: "session-9",
      sender: i % 2 ? "client" : "astrologer",
      text,
      timestamp: iso(at(seedDate, "08:30") + i * MINUTE),
      status: "read",
    })
  );
  return {
    version: 1,
    seedDate,
    now: at(seedDate, "09:00"),
    astrologers,
    clients,
    bookings,
    sessions,
    messages,
    schedules: astrologers.map(advisor => ({
      astrologerId: advisor.id,
      windows: Array.from({ length: 7 }, (_, day) => ({ day, start: "09:00", end: "20:00" })),
      overrides: [],
      blocks: [{ date: seedDate, start: "14:00", end: "14:30" }],
    })),
    testimonials: createTestimonials(),
    clientId: null,
    astrologerId: null,
    scenario: "normal",
  };
}

function resolvedWindows(schedule: Schedule, date: string) {
  const override = schedule.overrides.find(item => item.date === date);
  if (override) return override.windows;
  const weekday = new Date(`${date}T12:00:00+05:30`).getUTCDay();
  return schedule.windows.filter(window => window.day === weekday);
}

function scheduleAllows(schedule: Schedule, date: string, start: number, end: number) {
  return (
    resolvedWindows(schedule, date).some(window => start >= at(date, window.start) && end <= at(date, window.end)) &&
    !schedule.blocks.some(
      block => block.date === date && overlaps(start, end, at(date, block.start), at(date, block.end))
    )
  );
}

export function getSlots(
  state: DemoState,
  astrologerId: string,
  date: string,
  duration: Duration,
  includeUnavailable = false
): Slot[] {
  if (!durations.includes(duration)) fail("Choose a 30, 45, or 60 minute session.");
  date = dateKey(date);
  const today = dateKey(state.now);
  if (date < today || date >= addDays(today, 30)) return [];
  const schedule = state.schedules.find(item => item.astrologerId === astrologerId);
  if (!schedule) return [];
  const starts = new Set<number>();
  for (const window of resolvedWindows(schedule, date)) {
    for (
      let minute = Math.ceil(minuteOfDay(window.start) / 15) * 15;
      minute + duration <= minuteOfDay(window.end);
      minute += 15
    )
      starts.add(at(date, timeOfDay(minute)));
  }
  return [...starts]
    .sort((a, b) => a - b)
    .map(start => {
      const end = start + duration * MINUTE;
      const reason =
        start <= state.now
          ? "This time has already passed."
          : schedule.blocks.some(
                block => block.date === date && overlaps(start, end, at(date, block.start), at(date, block.end))
              )
            ? "This interval is blocked."
            : state.bookings.some(
                  booking =>
                    booking.astrologerId === astrologerId &&
                    booking.status !== "completed" &&
                    overlaps(start, end, Date.parse(booking.start), Date.parse(booking.end))
                )
              ? "This time is already booked."
              : undefined;
      return { start: iso(start), end: iso(end), available: !reason, ...(reason ? { reason } : {}) };
    })
    .filter(slot => includeUnavailable || slot.available);
}

function requireClient(state: DemoState): Client {
  return state.clients.find(client => client.id === state.clientId) ?? fail("Please sign in as a client to continue.");
}
function requireAstrologer(state: DemoState, id: string) {
  if (state.astrologerId !== id || !state.astrologers.some(advisor => advisor.id === id))
    fail("Sign in to edit your own astrologer workspace.");
}
function ownedSession(state: DemoState, id: string) {
  const session = state.sessions.find(item => item.id === id) ?? fail("Consultation not found.");
  const booking = state.bookings.find(item => item.id === session.bookingId) ?? fail("Booking not found.");
  if (booking.clientId !== state.clientId && booking.astrologerId !== state.astrologerId)
    fail("You can only access your own consultation.");
  return { session, booking };
}
const text = (value: string, label: string, max = 2000) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${label} is required and must be no longer than ${max} characters.`);
  return value.trim();
};

export function login(state: DemoState, role: Role, name?: string, contact?: string): DemoState {
  if (state.scenario === "error") fail("Demo sign-in failed. Change the demo scenario to Normal and try again.");
  if (role === "astrologer") return { ...state, astrologerId: "ananya-sharma" };
  if (role !== "client") fail("Choose a valid demo role.");
  const contactValue = contact?.trim().toLowerCase();
  if (!contactValue && (!name || name.toLowerCase() === "shivam")) return { ...state, clientId: "shivam" };
  if (contactValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue) && !/^\+?[\d ()-]{10,16}$/.test(contactValue))
    fail("Enter a valid email address or mobile number.");
  const existing = state.clients.find(client =>
    contactValue
      ? client.email.toLowerCase() === contactValue ||
        (client.mobile.replace(/\D/g, "") === contactValue.replace(/\D/g, "") && !contactValue.includes("@"))
      : client.name.toLowerCase() === name?.trim().toLowerCase()
  );
  if (existing) return { ...state, clientId: existing.id };
  const client: Client = {
    id: `client-${state.clients.length + 1}`,
    name: text(name || "Demo Guest", "Name", 80),
    email: contactValue?.includes("@") ? contactValue : "",
    mobile: contactValue && !contactValue.includes("@") ? contactValue : "",
    language: "English",
  };
  return { ...state, clients: [...state.clients, client], clientId: client.id };
}

export function logout(state: DemoState, role: Role): DemoState {
  return { ...state, [role === "client" ? "clientId" : "astrologerId"]: null };
}

export function updateClient(state: DemoState, patch: Partial<Client>): DemoState {
  const client = requireClient(state);
  const next: Client = { ...client, ...patch, id: client.id };
  next.name = text(next.name, "Name", 80);
  next.language = text(next.language, "Language", 60);
  next.email = next.email.trim();
  next.mobile = next.mobile.trim();
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) fail("Enter a valid email address.");
  if (next.mobile && !/^\+?[\d ()-]{10,16}$/.test(next.mobile)) fail("Enter a valid mobile number.");
  if (next.birthDate && dateKey(next.birthDate) > dateKey(state.now)) fail("Birth date cannot be in the future.");
  if (next.birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(next.birthTime))
    fail("Enter a valid birth time or leave it blank.");
  return { ...state, clients: state.clients.map(item => (item.id === client.id ? next : item)) };
}

export function updateAstrologer(state: DemoState, id: string, patch: Partial<Astrologer>): DemoState {
  requireAstrologer(state, id);
  const advisor = state.astrologers.find(item => item.id === id)!;
  const next = { ...advisor };
  for (const key of ["bio", "style", "name", "title", "specialty"] as const)
    if (patch[key] !== undefined) next[key] = text(patch[key], key, key === "bio" || key === "style" ? 3000 : 120);
  for (const key of ["expertise", "languages"] as const)
    if (patch[key]) {
      if (!patch[key].length || patch[key].length > 15) fail(`Choose at least one ${key} entry (up to 15).`);
      next[key] = [...new Set(patch[key].map(value => text(value, key, 60)))];
    }
  if (patch.prices) {
    if (
      durations.some(
        duration =>
          !Number.isSafeInteger(patch.prices![duration]) ||
          patch.prices![duration] <= 0 ||
          patch.prices![duration] > 100000000
      )
    )
      fail("Prices must be positive whole amounts in paise.");
    next.prices = { ...patch.prices };
  }
  return { ...state, astrologers: state.astrologers.map(item => (item.id === id ? next : item)) };
}

function validateRanges(ranges: { start: string; end: string }[]) {
  for (const range of ranges)
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(range.start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(range.end) ||
      range.start >= range.end
    )
      fail("Every availability window needs a valid start and end time range.");
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  if (sorted.some((range, index) => index > 0 && range.start < sorted[index - 1].end))
    fail("Availability windows cannot overlap.");
}
export function saveSchedule(state: DemoState, schedule: Schedule): DemoState {
  requireAstrologer(state, schedule.astrologerId);
  if (schedule.windows.some(window => !Number.isInteger(window.day) || window.day < 0 || window.day > 6))
    fail("Choose a valid weekday.");
  for (let day = 0; day < 7; day++) validateRanges(schedule.windows.filter(window => window.day === day));
  if (new Set(schedule.overrides.map(item => item.date)).size !== schedule.overrides.length)
    fail("Only one replacement override is allowed per date.");
  for (const override of schedule.overrides) {
    dateKey(override.date);
    validateRanges(override.windows);
  }
  for (const block of schedule.blocks) {
    dateKey(block.date);
    validateRanges([block]);
  }
  for (const booking of state.bookings.filter(
    item => item.astrologerId === schedule.astrologerId && item.status !== "completed"
  )) {
    if (!scheduleAllows(schedule, dateKey(booking.start), Date.parse(booking.start), Date.parse(booking.end)))
      fail(
        `This change conflicts with ${booking.id} (${formatDate(booking.start)}, ${formatTime(booking.start)}). Existing bookings cannot be moved.`
      );
  }
  return {
    ...state,
    schedules: state.schedules.map(item =>
      item.astrologerId === schedule.astrologerId ? structuredClone(schedule) : item
    ),
  };
}

export function bookConsultation(state: DemoState, input: BookingInput): { state: DemoState; booking: Booking } {
  const client = requireClient(state);
  const requestId = text(input.requestId, "Booking request ID", 160);
  const id = `booking-request-${encodeURIComponent(requestId)}`;
  const existing = state.bookings.find(booking => booking.id === id);
  if (existing) {
    if (
      existing.clientId !== client.id ||
      existing.astrologerId !== input.astrologerId ||
      Date.parse(existing.start) !== Date.parse(input.start) ||
      existing.duration !== input.duration
    )
      fail("This booking request was already used for different details. Please start a new request.");
    return { state, booking: existing };
  }
  const advisor = state.astrologers.find(item => item.id === input.astrologerId) ?? fail("Astrologer not found.");
  const slot = getSlots(state, advisor.id, dateKey(input.start), input.duration).find(
    item => Date.parse(item.start) === Date.parse(input.start)
  );
  if (!slot) fail("That time is no longer available. Please choose another slot.");
  if (
    state.bookings.some(
      booking =>
        booking.clientId === client.id &&
        booking.status !== "completed" &&
        overlaps(Date.parse(slot.start), Date.parse(slot.end), Date.parse(booking.start), Date.parse(booking.end))
    )
  )
    fail("You already have a consultation at this time. Choose another available slot.");
  if (state.scenario === "payment-failure")
    fail("Simulated payment failed. Nothing was charged or booked. Try again in the Normal scenario.");
  if (state.scenario === "error")
    fail("Booking is temporarily unavailable in the Error demo scenario. Please try again in Normal.");
  const booking: Booking = {
    id,
    astrologerId: advisor.id,
    astrologerName: advisor.name,
    clientId: client.id,
    sessionId: `session-request-${encodeURIComponent(requestId)}`,
    start: slot.start,
    end: slot.end,
    duration: input.duration,
    price: advisor.prices[input.duration],
    status: "confirmed",
    paymentStatus: "paid",
    topic: input.topic?.trim().slice(0, 300) || "Personal guidance",
  };
  const session: Session = {
    id: booking.sessionId,
    bookingId: id,
    status: "waiting",
    muted: false,
    cameraOff: false,
    speakerOff: false,
    sharing: false,
  };
  return {
    booking,
    state: { ...state, bookings: [...state.bookings, booking], sessions: [...state.sessions, session] },
  };
}

export function joinConsultation(state: DemoState, sessionId: string, demoNow = false): DemoState {
  const { session, booking } = ownedSession(state, sessionId);
  if (session.status === "ended" || booking.status === "completed")
    fail("This consultation has ended and cannot be restarted.");
  if (session.startedAt) return state;
  if (!demoNow && state.now < Date.parse(booking.start) - 10 * MINUTE)
    fail("Scheduled joining opens 10 minutes before your consultation. Use Start demo now to explore early.");
  if (state.now >= Date.parse(booking.end))
    fail("This scheduled consultation has passed. Book a new session to continue.");
  return {
    ...state,
    bookings: state.bookings.map(item => (item.id === booking.id ? { ...item, status: "active" } : item)),
    sessions: state.sessions.map(item =>
      item.id === sessionId ? { ...item, status: "active", startedAt: iso(state.now) } : item
    ),
  };
}

export function setCallStatus(state: DemoState, sessionId: string, status: CallStatus): DemoState {
  const { session, booking } = ownedSession(state, sessionId);
  if (status === "ended") return endConsultation(state, sessionId);
  if (!(["waiting", "astrologer-joined", "client-joined", "active", "unstable"] as string[]).includes(status))
    fail("Choose a valid simulated connection state.");
  if (session.status === "ended") fail("This consultation has ended.");
  if (!session.startedAt && (status === "active" || status === "unstable"))
    fail("Join the consultation before changing its connection state.");
  return {
    ...state,
    sessions: state.sessions.map(item => (item.id === sessionId ? { ...item, status } : item)),
    bookings: state.bookings.map(item =>
      item.id === booking.id && session.startedAt ? { ...item, status: "active" } : item
    ),
  };
}

export function toggleControl(
  state: DemoState,
  sessionId: string,
  control: "muted" | "cameraOff" | "speakerOff" | "sharing"
): DemoState {
  const { session } = ownedSession(state, sessionId);
  if (session.status === "ended") fail("This consultation has ended.");
  if (!["muted", "cameraOff", "speakerOff", "sharing"].includes(control)) fail("Unknown call control.");
  return {
    ...state,
    sessions: state.sessions.map(item => (item.id === sessionId ? { ...item, [control]: !item[control] } : item)),
  };
}

export function endConsultation(state: DemoState, sessionId: string): DemoState {
  const { session, booking } = ownedSession(state, sessionId);
  if (session.status === "ended") return state;
  if (!session.startedAt) fail("Join the consultation before ending it.");
  return {
    ...state,
    sessions: state.sessions.map(item =>
      item.id === sessionId ? { ...item, status: "ended", endedAt: iso(state.now), sharing: false } : item
    ),
    bookings: state.bookings.map(item => (item.id === booking.id ? { ...item, status: "completed" } : item)),
  };
}

export function rateConsultation(state: DemoState, sessionId: string, rating: number, feedback: string): DemoState {
  const client = requireClient(state);
  const { session, booking } = ownedSession(state, sessionId);
  if (client.id !== booking.clientId) fail("Only the client who booked this consultation can rate it.");
  if (session.status !== "ended") fail("Complete your consultation before leaving a rating.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail("Choose a rating from 1 to 5 stars.");
  if (feedback.trim().length > 2000) fail("Feedback must be 2,000 characters or fewer.");
  return {
    ...state,
    sessions: state.sessions.map(item =>
      item.id === sessionId ? { ...item, rating, feedback: feedback.trim() } : item
    ),
  };
}

export function sendMessage(state: DemoState, sessionId: string, value: string, sender?: Role): DemoState {
  const { session, booking } = ownedSession(state, sessionId);
  if (session.status === "ended") fail("This consultation has ended. Chat is now read-only.");
  const role = sender ?? (state.clientId === booking.clientId ? "client" : "astrologer");
  if (
    role === "client"
      ? booking.clientId !== state.clientId
      : role !== "astrologer" || booking.astrologerId !== state.astrologerId
  )
    fail("You can only send a message as your own signed-in role.");
  const message = {
    id: `chat-${state.messages.length + 1}-${state.now}`,
    sessionId,
    sender: role,
    text: text(value, "Message"),
    timestamp: iso(state.now),
    status: state.scenario === "error" ? ("failed" as const) : ("sent" as const),
  };
  return { ...state, messages: [...state.messages, message] };
}

export function replyMessage(state: DemoState, sessionId: string): DemoState {
  const { session, booking } = ownedSession(state, sessionId);
  if (session.status === "ended") return state;
  const pending = state.messages.filter(message => message.sessionId === sessionId && message.status === "sent");
  if (state.scenario === "error") return state;
  const last = pending.at(-1);
  const hasMessages = state.messages.some(message => message.sessionId === sessionId);
  if (!last && hasMessages) return state;
  const replyId = last ? `reply-${last.id}` : `welcome-${sessionId}`;
  if (state.messages.some(message => message.id === replyId)) return state;
  const sender: Role = last?.sender === "astrologer" ? "client" : "astrologer";
  const response = !last
    ? `Welcome. I’m ${booking.astrologerName.split(" ")[0]}. What would you like to explore in this simulated consultation?`
    : sender === "client"
      ? "Thank you. I would like to explore that perspective a little more."
      : /career|work|job/i.test(last.text)
        ? "Let’s explore what you want from your next chapter. What feels most important to you in your work right now?"
        : /birth|born|date|time/i.test(last.text)
          ? "Thank you for sharing. Birth details are optional here; we can work with whatever you are comfortable providing."
          : "Thank you for sharing that. Let’s slow down and look at the question together. What would a useful next step feel like for you?";
  return {
    ...state,
    messages: [
      ...state.messages.map(message =>
        pending.some(item => item.id === message.id) ? { ...message, status: "read" as const } : message
      ),
      { id: replyId, sessionId, sender, text: response, timestamp: iso(state.now), status: "read" },
    ],
  };
}

export function retryMessage(state: DemoState, messageId: string): DemoState {
  const message = state.messages.find(item => item.id === messageId) ?? fail("Message not found.");
  const { session, booking } = ownedSession(state, message.sessionId);
  if (session.status === "ended") fail("This consultation has ended.");
  if (message.sender === "client" ? state.clientId !== booking.clientId : state.astrologerId !== booking.astrologerId)
    fail("You can only retry your own message.");
  if (message.status !== "failed") return state;
  if (state.scenario === "error")
    fail("Message delivery is still unavailable in the Error scenario. Switch to Normal and retry.");
  return {
    ...state,
    messages: state.messages.map(item => (item.id === messageId ? { ...item, status: "sent" } : item)),
  };
}

const escapeIcs = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsTime = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export function calendarText(booking: Booking): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ASTRA//Simulated consultation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@astra.demo`,
    `DTSTAMP:${icsTime(booking.start)}`,
    `DTSTART:${icsTime(booking.start)}`,
    `DTEND:${icsTime(booking.end)}`,
    `SUMMARY:${escapeIcs(`ASTRA · ${booking.astrologerName}`)}`,
    `DESCRIPTION:${escapeIcs(`Simulated consultation. ${booking.topic}. No real payment or video service.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
export function calendarDownload(booking: Booking): void {
  const url = URL.createObjectURL(new Blob([calendarText(booking)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `astra-${booking.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const nonempty = z.string().min(1);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(value => {
    try {
      return dateKey(value) === value;
    } catch {
      return false;
    }
  });
const instant = z.string().datetime({ offset: true });
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const rangeSchema = z.object({ start: clockTime, end: clockTime }).refine(range => range.start < range.end);
const priceSchema = z.number().int().positive().max(100000000);
const pricesSchema = z.object({ 30: priceSchema, 45: priceSchema, 60: priceSchema });
const snapshotSchema = z.object({
  version: z.literal(1),
  seedDate: dateSchema,
  now: z.number().finite().nonnegative(),
  clientId: nonempty.nullable(),
  astrologerId: nonempty.nullable(),
  scenario: z.enum(["normal", "loading", "error", "empty", "payment-failure"]),
  clients: z
    .array(
      z.object({
        id: nonempty,
        name: nonempty,
        email: z.string(),
        mobile: z.string(),
        language: nonempty,
        birthDate: z.string().optional(),
        birthTime: z.string().optional(),
        birthPlace: z.string().optional(),
        birthDetailsConsent: z.boolean().optional(),
      })
    )
    .min(1),
  astrologers: z
    .array(
      z.object({
        id: nonempty,
        name: nonempty,
        title: nonempty,
        specialty: nonempty,
        expertise: z.array(nonempty).min(1),
        experience: z.number().nonnegative(),
        languages: z.array(nonempty).min(1),
        rating: z.number().min(0).max(5),
        consultations: z.number().int().nonnegative(),
        gender: z.enum(["Female", "Male"]),
        image: nonempty,
        color: nonempty,
        bio: nonempty,
        style: nonempty,
        prices: pricesSchema,
        featured: z.boolean(),
        reviews: z.array(
          z.object({ id: nonempty, name: nonempty, rating: z.number().min(1).max(5), text: nonempty, topic: nonempty })
        ),
      })
    )
    .min(1),
  schedules: z.array(
    z.object({
      astrologerId: nonempty,
      windows: z.array(z.object({ day: z.number().int().min(0).max(6), start: clockTime, end: clockTime })),
      overrides: z.array(z.object({ date: dateSchema, windows: z.array(rangeSchema) })),
      blocks: z.array(z.object({ date: dateSchema, start: clockTime, end: clockTime })),
    })
  ),
  bookings: z.array(
    z.object({
      id: nonempty,
      astrologerId: nonempty,
      clientId: nonempty,
      sessionId: nonempty,
      start: instant,
      end: instant,
      duration: z.union([z.literal(30), z.literal(45), z.literal(60)]),
      price: priceSchema,
      status: z.enum(["confirmed", "active", "completed"]),
      paymentStatus: z.literal("paid"),
      topic: nonempty,
      astrologerName: nonempty,
    })
  ),
  sessions: z.array(
    z.object({
      id: nonempty,
      bookingId: nonempty,
      status: z.enum(["waiting", "astrologer-joined", "client-joined", "active", "unstable", "ended"]),
      startedAt: instant.optional(),
      endedAt: instant.optional(),
      rating: z.number().int().min(1).max(5).optional(),
      feedback: z.string().optional(),
      muted: z.boolean(),
      cameraOff: z.boolean(),
      speakerOff: z.boolean(),
      sharing: z.boolean(),
    })
  ),
  messages: z.array(
    z.object({
      id: nonempty,
      sessionId: nonempty,
      sender: z.enum(["client", "astrologer"]),
      text: nonempty,
      timestamp: instant,
      status: z.enum(["sent", "read", "failed"]),
    })
  ),
  testimonials: z.array(z.object({ id: nonempty, name: nonempty, city: nonempty, text: nonempty, topic: nonempty })),
});

export function validateSnapshot(value: unknown): DemoState {
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success) fail("Saved demo snapshot is invalid or outdated. Reset the demo to recover.");
  const state = parsed.data;
  const invalid = () => fail("Saved demo snapshot contains inconsistent records. Reset the demo to recover.");
  for (const records of [
    state.clients,
    state.astrologers,
    state.bookings,
    state.sessions,
    state.messages,
    state.testimonials,
  ])
    if (new Set(records.map(item => item.id)).size !== records.length) invalid();
  if (
    (state.clientId && !state.clients.some(item => item.id === state.clientId)) ||
    (state.astrologerId && !state.astrologers.some(item => item.id === state.astrologerId))
  )
    invalid();
  if (
    state.schedules.length !== state.astrologers.length ||
    new Set(state.schedules.map(item => item.astrologerId)).size !== state.schedules.length
  )
    invalid();
  for (const schedule of state.schedules) {
    if (!state.astrologers.some(item => item.id === schedule.astrologerId)) invalid();
    try {
      for (let day = 0; day < 7; day++) validateRanges(schedule.windows.filter(window => window.day === day));
      for (const override of schedule.overrides) validateRanges(override.windows);
      for (const block of schedule.blocks) validateRanges([block]);
      if (new Set(schedule.overrides.map(item => item.date)).size !== schedule.overrides.length) invalid();
    } catch {
      invalid();
    }
  }
  for (const booking of state.bookings) {
    const session = state.sessions.find(item => item.id === booking.sessionId);
    if (
      !state.clients.some(item => item.id === booking.clientId) ||
      !state.astrologers.some(item => item.id === booking.astrologerId) ||
      session?.bookingId !== booking.id ||
      Date.parse(booking.end) - Date.parse(booking.start) !== booking.duration * MINUTE
    )
      invalid();
    if (
      (booking.status === "completed" && session?.status !== "ended") ||
      (session?.status === "ended" && booking.status !== "completed")
    )
      invalid();
  }
  for (const session of state.sessions) {
    if (!state.bookings.some(item => item.id === session.bookingId && item.sessionId === session.id)) invalid();
    if (session.status === "ended" && (!session.startedAt || !session.endedAt)) invalid();
    if (session.endedAt && (!session.startedAt || Date.parse(session.endedAt) < Date.parse(session.startedAt)))
      invalid();
    if (session.rating && session.status !== "ended") invalid();
  }
  if (state.messages.some(message => !state.sessions.some(session => session.id === message.sessionId))) invalid();
  const currentPortraits = new Map(createAdvisors().map(advisor => [advisor.id, advisor.image]));
  state.astrologers = state.astrologers.map(advisor => {
    const image = currentPortraits.get(advisor.id);
    return image && advisor.image === `/portraits/${advisor.id}.svg` ? { ...advisor, image } : advisor;
  });
  return state;
}
