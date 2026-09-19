import type { Astrologer, Testimonial } from "../types/domain";

type AdvisorSeed = Pick<
  Astrologer,
  | "id"
  | "name"
  | "title"
  | "specialty"
  | "expertise"
  | "experience"
  | "languages"
  | "rating"
  | "consultations"
  | "gender"
  | "color"
  | "bio"
  | "style"
  | "prices"
>;

const profiles: AdvisorSeed[] = [
  {
    id: "ananya-sharma",
    name: "Ananya Sharma",
    title: "Vedic astrologer & life guide",
    specialty: "Vedic Astrology",
    expertise: ["Career", "Relationships", "Life Direction"],
    experience: 12,
    languages: ["English", "Hindi"],
    rating: 4.9,
    consultations: 2300,
    gender: "Female",
    color: "#e8cbb5",
    prices: { 30: 149900, 45: 209900, 60: 269900 },
    bio: "Ananya brings a thoughtful, grounded approach to traditional Vedic astrology. Her fictional practice explores career crossroads, relationship patterns, and the quieter questions that shape a fulfilling life. Sessions balance chart interpretation with practical reflection; the choice of what to do next always remains yours.",
    style:
      "Warm, collaborative, and practical. We begin with your question, explore the patterns together, and finish with a few clear reflections to take away.",
  },
  {
    id: "raghav-mehta",
    name: "Raghav Mehta",
    title: "Career & finance astrology guide",
    specialty: "KP Astrology",
    expertise: ["Career", "Finance", "Business"],
    experience: 15,
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    consultations: 3100,
    gender: "Male",
    color: "#cfb9a0",
    prices: { 30: 149900, 45: 199900, 60: 259900 },
    bio: "Raghav's fictional practice combines Vedic and Krishnamurti approaches to help clients reflect on professional change and long-term direction. He explains the reasoning behind each interpretation and welcomes questions. Guidance is exploratory, never a promise of investment outcomes.",
    style:
      "Structured and analytical, with room for conversation. Bring one or two questions for an unhurried look at your options.",
  },
  {
    id: "meera-kapoor",
    name: "Meera Kapoor",
    title: "Relationships & marriage guide",
    specialty: "Tarot Reading",
    expertise: ["Relationships", "Marriage", "Self Discovery"],
    experience: 9,
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.8,
    consultations: 1650,
    gender: "Female",
    color: "#d9bbb8",
    prices: { 30: 99900, 45: 139900, 60: 179900 },
    bio: "Meera uses tarot as a gentle prompt for self-reflection rather than a fixed prediction. Her fictional consultations make space for uncertainty, relationships, and new beginnings. You do not need birth details or previous experience with tarot to join.",
    style:
      "Conversational, empathetic, and judgement-free. Each reading turns symbols into questions you can use in everyday life.",
  },
  {
    id: "dev-patel",
    name: "Dev Patel",
    title: "Numerology & personal cycles guide",
    specialty: "Numerology",
    expertise: ["Business", "Self Discovery", "Career"],
    experience: 11,
    languages: ["English", "Gujarati", "Hindi"],
    rating: 4.7,
    consultations: 1280,
    gender: "Male",
    color: "#d7c4a5",
    prices: { 30: 119900, 45: 169900, 60: 219900 },
    bio: "Dev's fictional numerology consultations explore the stories people attach to names, dates, and personal cycles. His focus is on useful perspective and considered decision-making, not guaranteed outcomes or costly remedies.",
    style: "Clear explanations with a playful sense of curiosity. A good starting point if you are new to numerology.",
  },
  {
    id: "ishita-rao",
    name: "Ishita Rao",
    title: "Western astrology practitioner",
    specialty: "Western Astrology",
    expertise: ["Relationships", "Self Discovery", "Life Direction"],
    experience: 12,
    languages: ["English", "Kannada"],
    rating: 4.9,
    consultations: 1820,
    gender: "Female",
    color: "#cbb8c9",
    prices: { 30: 139900, 45: 189900, 60: 249900 },
    bio: "Ishita's fictional approach to Western astrology explores identity, connection, and changing seasons of life. She translates chart language into accessible conversation and avoids deterministic labels. Sessions offer reflection, not mental-health treatment.",
    style: "Reflective and spacious, with an emphasis on understanding your own strengths and boundaries.",
  },
  {
    id: "arjun-joshi",
    name: "Arjun Joshi",
    title: "Vedic astrology & timing guide",
    specialty: "Vedic Astrology",
    expertise: ["Career", "Education", "Life Direction"],
    experience: 16,
    languages: ["English", "Hindi", "Marathi"],
    rating: 4.8,
    consultations: 2680,
    gender: "Male",
    color: "#c3b6a2",
    prices: { 30: 159900, 45: 219900, 60: 289900 },
    bio: "Arjun offers a fictional blend of classical Vedic interpretation and practical discussion for study, career, and major transitions. He gives context to traditional timing concepts while recognising that preparation and personal decisions matter.",
    style: "Patient, educational, and focused. You will have time to ask how an interpretation was reached.",
  },
  {
    id: "kavya-iyer",
    name: "Kavya Iyer",
    title: "Vedic astrologer & relationship guide",
    specialty: "Vedic Astrology",
    expertise: ["Relationships", "Family", "Self Discovery"],
    experience: 10,
    languages: ["English", "Tamil", "Hindi"],
    rating: 4.9,
    consultations: 1540,
    gender: "Female",
    color: "#d4b09f",
    prices: { 30: 129900, 45: 179900, 60: 229900 },
    bio: "Kavya's fictional consultations consider relationship patterns, communication, and the expectations we inherit. Her approach is inclusive and avoids fear-based compatibility verdicts. Astrology is a conversation starter, not a decision-maker for your relationships.",
    style: "Sensitive and balanced. We look at your experience first, then explore any chart themes that feel useful.",
  },
  {
    id: "vikram-sen",
    name: "Vikram Sen",
    title: "Vastu & space wellbeing consultant",
    specialty: "Vastu",
    expertise: ["Home", "Business", "Life Direction"],
    experience: 21,
    languages: ["English", "Hindi", "Bengali"],
    rating: 4.8,
    consultations: 3650,
    gender: "Male",
    color: "#bcc0b5",
    prices: { 30: 179900, 45: 249900, 60: 319900 },
    bio: "Vikram's fictional consultations explore traditional Vastu ideas through practical questions about how you live and work. He favours low-cost, reversible adjustments and does not promise health, wealth, or structural safety outcomes.",
    style:
      "Pragmatic and visual. Describe your space and we can discuss small changes without pressure to buy anything.",
  },
  {
    id: "tara-desai",
    name: "Tara Desai",
    title: "Tarot & reflective wellbeing guide",
    specialty: "Tarot Reading",
    expertise: ["Self Discovery", "Career", "Relationships"],
    experience: 7,
    languages: ["English", "Marathi"],
    rating: 4.7,
    consultations: 920,
    gender: "Female",
    color: "#cfb7a8",
    prices: { 30: 89900, 45: 129900, 60: 169900 },
    bio: "Tara creates fictional tarot conversations for people navigating everyday uncertainty. The cards are used as creative prompts to articulate what matters and identify possible next steps. No question is too small, and nothing is presented as an unavoidable future.",
    style: "Gentle and down-to-earth, with a focus on a useful question rather than a definitive prediction.",
  },
  {
    id: "neel-verma",
    name: "Neel Verma",
    title: "KP astrology & career consultant",
    specialty: "KP Astrology",
    expertise: ["Career", "Education", "Business"],
    experience: 13,
    languages: ["English", "Hindi", "Telugu"],
    rating: 4.8,
    consultations: 1940,
    gender: "Male",
    color: "#b8c2ce",
    prices: { 30: 139900, 45: 189900, 60: 239900 },
    bio: "Neel's fictional practice offers a clear introduction to KP astrology for professional and educational crossroads. He makes room for both traditional interpretation and real-world constraints, encouraging independent thought rather than dependence on a reading.",
    style:
      "Focused and reassuring. We clarify the question, explore possible perspectives, and leave space for your own judgement.",
  },
];

export function createAdvisors(): Astrologer[] {
  return profiles.map((profile, index) => ({
    ...profile,
    expertise: [...profile.expertise],
    languages: [...profile.languages],
    prices: { ...profile.prices },
    image: `/portraits/${index + 1}.jpg`,
    featured: index < 4,
    reviews: [
      {
        id: `${profile.id}-review-1`,
        name: ["Priya K.", "Aman R.", "Nisha S."][index % 3],
        rating: 5,
        text: "A thoughtful conversation that helped me see my question from a fresh perspective. Fictional demo review.",
        topic: profile.expertise[0],
      },
      {
        id: `${profile.id}-review-2`,
        name: "Rahul M.",
        rating: 5,
        text: "I appreciated the clear explanations and space to ask questions. Fictional demo review.",
        topic: profile.expertise[1],
      },
    ],
  }));
}

export function createTestimonials(): Testimonial[] {
  return [
    {
      id: "testimonial-1",
      name: "Priya",
      city: "Bengaluru",
      topic: "Career clarity",
      text: "I came with a hundred questions and left with a calmer way to think about my next step.",
    },
    {
      id: "testimonial-2",
      name: "Rahul",
      city: "Mumbai",
      topic: "A fresh perspective",
      text: "It felt like a thoughtful conversation, not a list of predictions. I had room to ask what really mattered.",
    },
    {
      id: "testimonial-3",
      name: "Nisha",
      city: "New Delhi",
      topic: "Space to reflect",
      text: "The private session made it easy to open up. The practical reflections stayed with me afterwards.",
    },
    {
      id: "testimonial-4",
      name: "Aman",
      city: "Pune",
      topic: "Life direction",
      text: "Booking was simple, and the conversation helped me put words to what I was feeling.",
    },
    {
      id: "testimonial-5",
      name: "Kritika",
      city: "Chennai",
      topic: "A thoughtful pause",
      text: "A quiet hour to step back and consider my options without feeling rushed or judged.",
    },
  ];
}
