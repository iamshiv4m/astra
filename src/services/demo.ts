import * as domain from "../lib/domain";
import type { Astrologer, Booking, BookingInput, CallStatus, ChatMessage, Client, DemoState, Duration, Role, Schedule, Session, Slot } from "../types/domain";

/** Local-only adapters. All promises resolve in memory; none contacts a provider. */
export interface DemoRepository { getState(): DemoState; commit(state: DemoState): void }
export interface AuthService { login(role: Role, name?: string, contact?: string): Promise<void>; logout(role: Role): Promise<void> }
export interface AstrologerService { list(): Promise<Astrologer[]>; get(id: string): Promise<Astrologer>; update(id: string, patch: Partial<Astrologer>): Promise<void> }
export interface ProfileService { currentClient(): Promise<Client | null>; update(patch: Partial<Client>): Promise<void> }
export interface AvailabilityService { slots(id: string, date: string, duration: Duration, includeUnavailable?: boolean): Promise<Slot[]>; save(schedule: Schedule): Promise<void> }
export interface BookingService { list(): Promise<Booking[]>; get(id: string): Promise<Booking>; confirm(input: BookingInput): Promise<Booking> }
export interface PaymentReceipt { id: string; bookingId: string; amount: number; currency: "INR"; status: "paid"; simulated: true }
export interface PaymentService { receipt(bookingId: string): Promise<PaymentReceipt> }
export interface SessionService { get(id: string): Promise<Session>; join(id: string, demoNow?: boolean): Promise<void>; end(id: string): Promise<void>; rate(id: string, rating: number, feedback: string): Promise<void> }
export interface VideoService { setStatus(id: string, status: CallStatus): Promise<void>; toggle(id: string, control: "muted" | "cameraOff" | "speakerOff" | "sharing"): Promise<void> }
export interface ChatService { list(id: string): Promise<ChatMessage[]>; send(id: string, text: string, sender?: Role): Promise<void>; reply(id: string): Promise<void>; retry(messageId: string): Promise<void> }
export interface DemoNotification { id: string; bookingId: string; title: string; body: string; simulated: true }
export interface NotificationService { list(): Promise<DemoNotification[]> }
export interface DemoServices { auth: AuthService; astrologer: AstrologerService; profile: ProfileService; availability: AvailabilityService; booking: BookingService; payment: PaymentService; session: SessionService; video: VideoService; chat: ChatService; notification: NotificationService }

export function createServices(repository: DemoRepository): DemoServices {
  const mutate = async (operation: (state: DemoState) => DemoState) => { repository.commit(operation(repository.getState())); };
  const ownedBookings = () => {
    const state = repository.getState();
    return state.bookings.filter(booking => booking.clientId === state.clientId || booking.astrologerId === state.astrologerId);
  };
  const getBooking = (id: string) => {
    const booking = ownedBookings().find(item => item.id === id);
    if (!booking) throw new Error("Booking not found or not accessible to your signed-in identity.");
    return booking;
  };
  const getSession = (id: string) => {
    const session = repository.getState().sessions.find(item => item.id === id);
    if (!session) throw new Error("Consultation not found.");
    getBooking(session.bookingId);
    return session;
  };
  return {
    auth: { login: (role, name, contact) => mutate(state => domain.login(state, role, name, contact)), logout: role => mutate(state => domain.logout(state, role)) },
    astrologer: {
      list: async () => structuredClone(repository.getState().astrologers),
      get: async id => {
        const advisor = repository.getState().astrologers.find(item => item.id === id);
        if (!advisor) throw new Error("Astrologer not found.");
        return structuredClone(advisor);
      },
      update: (id, patch) => mutate(state => domain.updateAstrologer(state, id, patch)),
    },
    profile: { currentClient: async () => { const state = repository.getState(); return structuredClone(state.clients.find(client => client.id === state.clientId) ?? null); }, update: patch => mutate(state => domain.updateClient(state, patch)) },
    availability: { slots: async (id, date, duration, includeUnavailable) => domain.getSlots(repository.getState(), id, date, duration, includeUnavailable), save: schedule => mutate(state => domain.saveSchedule(state, schedule)) },
    booking: { list: async () => structuredClone(ownedBookings()), get: async id => structuredClone(getBooking(id)), confirm: async input => { const result = domain.bookConsultation(repository.getState(), input); repository.commit(result.state); return structuredClone(result.booking); } },
    payment: { receipt: async id => { const booking = getBooking(id); return { id: `receipt-${booking.id}`, bookingId: booking.id, amount: booking.price, currency: "INR", status: booking.paymentStatus, simulated: true }; } },
    session: { get: async id => structuredClone(getSession(id)), join: (id, demoNow) => mutate(state => domain.joinConsultation(state, id, demoNow)), end: id => mutate(state => domain.endConsultation(state, id)), rate: (id, rating, feedback) => mutate(state => domain.rateConsultation(state, id, rating, feedback)) },
    video: { setStatus: (id, status) => mutate(state => domain.setCallStatus(state, id, status)), toggle: (id, control) => mutate(state => domain.toggleControl(state, id, control)) },
    chat: { list: async id => { getSession(id); return structuredClone(repository.getState().messages.filter(message => message.sessionId === id)); }, send: (id, text, sender) => mutate(state => domain.sendMessage(state, id, text, sender)), reply: id => mutate(state => domain.replyMessage(state, id)), retry: id => mutate(state => domain.retryMessage(state, id)) },
    notification: { list: async () => ownedBookings().map(booking => ({ id: `notification-${booking.id}-${booking.status}`, bookingId: booking.id, title: booking.status === "completed" ? "Consultation complete" : booking.status === "active" ? "Simulated consultation in progress" : "Demo booking confirmed", body: `${booking.astrologerName} · ${domain.formatDate(booking.start)} at ${domain.formatTime(booking.start)} IST. In-app demo notification only.`, simulated: true })) },
  };
}
