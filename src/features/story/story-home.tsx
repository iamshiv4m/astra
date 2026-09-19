"use client";

import { Fragment, memo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Compass,
  CreditCard,
  Heart,
  LockKeyhole,
  Mic,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";
import type { Astrologer, Testimonial } from "@/types/domain";
import { money } from "@/lib/domain";
import { Hero } from "@/components/hero";
import { AstrologerCard } from "@/components/astrologer-card";
import { IndiaDiscovery } from "./india-discovery";
import { MobileDisclosure } from "./mobile-disclosure";
import styles from "./story.module.css";

export const storyTopics = [
  {
    label: "Career",
    search: "Career",
    icon: BriefcaseBusiness,
    question: "Is it time for a different path?",
    title: "You're not behind. You're at a crossroads.",
    detail:
      "A new role, a competitive exam, or starting something of your own. Beyond everyone else's advice, make space to explore what matters to you.",
    mood: "possibility",
  },
  {
    label: "Relationships",
    search: "Relationships",
    icon: Heart,
    question: "What are we really looking for?",
    title: "Some connections need a new perspective.",
    detail:
      "Love, marriage, family expectations. Your relationship is more than a compatibility score. Begin with your own questions, in your own words.",
    mood: "connection",
  },
  {
    label: "Self-discovery",
    search: "Self Discovery",
    icon: Compass,
    question: "What does my next chapter look like?",
    title: "There's more to your story than you know.",
    detail:
      "You don't need a big life decision to be curious about yourself. Explore your strengths, your rhythms, and the possibilities ahead.",
    mood: "discovery",
  },
  {
    label: "Family",
    search: "Family",
    icon: Users,
    question: "How do I find my own balance?",
    title: "There is room for your story, too.",
    detail:
      "Between caring for others and choosing for yourself, clarity can feel far away. A thoughtful conversation is a place to start.",
    mood: "belonging",
  },
];

export function QuestionChapter() {
  const [selected, setSelected] = useState(0);
  const topic = storyTopics[selected];
  return (
    <section className={styles.questionChapter}>
      <div className={`container ${styles.questionLayout}`}>
        <div className={styles.chapterHeading}>
          <span className={styles.chapterNumber}>01 / YOUR QUESTION</span>
          <h2>
            Life doesn&apos;t
            <br /> come with
            <br /> <em>a straight line.</em>
          </h2>
          <p>
            Maybe something is changing.
            <br /> Maybe you&apos;re ready for it to.
          </p>
          <div className={styles.handDrawnPath} aria-hidden="true">
            <svg viewBox="0 0 220 85" fill="none">
              <path d="M3 52C34 3 75 1 87 36s-24 61-36 37 51-62 100-39 52 12 64-17" />
              <path d="m195 16 22-2-2 22" />
            </svg>
          </div>
        </div>
        <div className={styles.questionExperience}>
          <h3>What&apos;s on your mind?</h3>
          <div className={styles.topicPicker} aria-label="Choose your starting point">
            {storyTopics.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <item.icon size={17} strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
          </div>
          <div
            className={styles.questionAnswer}
            data-mood={topic.mood}
            role="region"
            aria-label="Your starting point"
            aria-live="polite"
          >
            <span className={styles.largeQuote} aria-hidden="true">
              &ldquo;
            </span>
            <p className={styles.questionText}>{topic.question}</p>
            <div className={styles.answerDivider} />
            <h4>{topic.title}</h4>
            <p className={styles.answerDetail}>{topic.detail}</p>
            <Link href={`/astrologers?search=${encodeURIComponent(topic.search)}`} className={styles.answerLink}>
              Find guidance for {topic.label.toLowerCase()} <ArrowUpRight size={20} />
            </Link>
            <span className={styles.answerStar} aria-hidden="true">
              ✦
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const pathSteps = [
  {
    name: "Choose your guide",
    detail: "Find someone whose experience and approach feel right for your question.",
    title: "A person, not a prediction.",
    text: "Get to know your guide before you meet. Explore their approach, experience and areas of guidance.",
  },
  {
    name: "Choose your moment",
    detail: "Thirty, forty-five or sixty minutes. At a time that fits your life.",
    title: "Unhurried. On your terms.",
    text: "See real availability in the demo, choose your session length, and make a little room for yourself.",
  },
  {
    name: "Reserve your space",
    detail: "Review every detail, see one clear price, and confirm your private session.",
    title: "One less thing to wonder about.",
    text: "Your time, your guide and your session price are clear before you book. Payments are simulated in this prototype.",
  },
  {
    name: "Meet over video",
    detail: "Bring yourself, your questions, and an open mind. Your guide will meet you there.",
    title: "A real conversation. Room for every question.",
    text: "A calm one-to-one space with video and chat. Try the simulated consultation, then leave your reflections and feedback.",
  },
];

export function ConversationPath({ astrologer }: { astrologer: Astrologer }) {
  const [step, setStep] = useState(0);
  const tabs = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % pathSteps.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = (index + pathSteps.length - 1) % pathSteps.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = pathSteps.length - 1;
    else return;
    event.preventDefault();
    setStep(next);
    tabs.current?.querySelector<HTMLButtonElement>(`#story-step-${next}`)?.focus();
  };
  return (
    <section className={styles.pathSection} id="how-it-works">
      <div className="container">
        <div className={styles.pathHeading}>
          <span className={styles.chapterNumber}>03 / YOUR CONVERSATION</span>
          <h2>
            <span className={styles.desktopOnly}>A little space.<br /> <em>A meaningful conversation.</em></span>
            <span className={styles.phoneOnly}>How it works</span>
          </h2>
          <p>
            From your first question to your first session,
            <br /> we keep the experience beautifully simple.
          </p>
        </div>
        <ol className={styles.simpleSteps} aria-label="Your consultation in three steps">
          <li><strong>Choose</strong><span>A guide who fits your question.</span></li>
          <li><strong>Book</strong><span>Pick a time and review the price.</span></li>
          <li><strong>Connect</strong><span>Meet one-to-one over video and chat.</span></li>
        </ol>
        <p className={styles.mobileDemoNote}>Demo only. Calls and payments are simulated.</p>
        <div className={styles.pathLayout}>
          <div
            ref={tabs}
            className={styles.pathTabs}
            role="tablist"
            aria-label="How your consultation works"
            aria-orientation="vertical"
          >
            {pathSteps.map((item, index) => (
              <button
                key={item.name}
                id={`story-step-${index}`}
                role="tab"
                aria-selected={step === index}
                aria-controls="story-step-panel"
                tabIndex={step === index ? 0 : -1}
                onKeyDown={event => onKeyDown(event, index)}
                onClick={() => setStep(index)}
              >
                <span className={styles.pathNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
          <div
            id="story-step-panel"
            role="tabpanel"
            aria-labelledby={`story-step-${step}`}
            className={styles.pathPanel}
          >
            <div className={styles.previewScene} data-step={step}>
              {step === 0 && (
                <div className={styles.guidePreview}>
                  <Image src={astrologer.image} alt={astrologer.name} width={150} height={180} />
                  <div>
                    <BadgeCheck size={24} />
                    <h3>{astrologer.name}</h3>
                    <p>{astrologer.experience} years of thoughtful guidance</p>
                    <span>{astrologer.specialty}</span>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className={styles.timePreview}>
                  <CalendarDays size={38} strokeWidth={1.2} />
                  <h3>A moment that&apos;s yours.</h3>
                  <div>
                    <span>30 min</span>
                    <span>45 min</span>
                    <span>60 min</span>
                  </div>
                  <p>
                    Your timezone. Your pace.
                    <br /> A little room to breathe.
                  </p>
                </div>
              )}
              {step === 2 && (
                <div className={styles.receiptPreview}>
                  <span className={styles.receiptCheck}>
                    <Check size={26} />
                  </span>
                  <h3>Nothing left to guess.</h3>
                  <div>
                    <span>Your guide</span>
                    <strong>{astrologer.name}</strong>
                  </div>
                  <div>
                    <span>Your time</span>
                    <strong>30 minutes</strong>
                  </div>
                  <div>
                    <span>Session price</span>
                    <strong>{money(astrologer.prices[30])}</strong>
                  </div>
                  <small>Illustrative booking · No payment taken</small>
                </div>
              )}
              {step === 3 && (
                <div className={styles.callPreview}>
                  <Image
                    src={astrologer.image}
                    alt={`Consultation preview with ${astrologer.name}`}
                    fill
                    sizes="(max-width: 700px) 90vw, 420px"
                  />
                  <span className={styles.callPreviewTag}>Consultation preview · Simulated</span>
                  <div className={styles.previewMessage}>Let&apos;s begin with what&apos;s on your mind.</div>
                  <div className={styles.previewCallIcons} aria-hidden="true">
                    <span>
                      <Mic size={17} />
                    </span>
                    <span>
                      <Video size={17} />
                    </span>
                    <span>
                      <Heart size={17} />
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.pathPanelCopy}>
              <h3>{pathSteps[step].title}</h3>
              <p>{pathSteps[step].text}</p>
            </div>
          </div>
        </div>
        <div className={styles.pathCta}>
          <Link href="/astrologers" className="btn btn-primary">
            Begin your conversation <ArrowRight size={17} />
          </Link>
          <span>No app download. Just a little time for you.</span>
        </div>
      </div>
    </section>
  );
}

function VoiceRibbonTrack({
  testimonials,
  decorative = false,
}: {
  testimonials: Testimonial[];
  decorative?: boolean;
}) {
  const count = Math.max(storyTopics.length, testimonials.length);
  return (
    <div className={styles.voiceRibbonTrack} aria-hidden={decorative || undefined}>
      {Array.from({ length: count }, (_, index) => {
        const topic = storyTopics[index];
        const voice = testimonials[index];
        return (
          <Fragment key={topic?.label ?? voice?.id ?? index}>
            {topic ? (
              <Link
                href={`/astrologers?search=${encodeURIComponent(topic.search)}`}
                className={styles.voiceChip}
                tabIndex={decorative ? -1 : undefined}
              >
                <topic.icon size={15} strokeWidth={1.7} aria-hidden="true" />
                {topic.label}
              </Link>
            ) : null}
            {voice ? (
              <figure className={styles.voiceQuote}>
                <blockquote>{voice.text}</blockquote>
                <figcaption>
                  {voice.name} · {voice.city}
                </figcaption>
              </figure>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

function VoiceRibbon({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className={styles.voiceRibbon} aria-label="Topics and illustrative voices">
      <div className={styles.voiceRibbonViewport}>
        <VoiceRibbonTrack testimonials={testimonials} />
        <VoiceRibbonTrack testimonials={testimonials} decorative />
      </div>
      <p>Illustrative voices from this demo, not actual customer endorsements.</p>
    </section>
  );
}

export const StoryHome = memo(function StoryHome({
  astrologers,
  testimonials,
  ready,
}: {
  astrologers: Astrologer[];
  testimonials: Testimonial[];
  ready: boolean;
}) {
  const guide = astrologers[0];
  return (
    <div className={styles.storyHome}>
      <Hero />
      <VoiceRibbon testimonials={testimonials} />
      <nav className={styles.chapterNav} aria-label="Your ASTRA story">
        <div className="container">
          {[
            { label: "Your question", id: "your-question", icon: Sparkles },
            { label: "Your guide", id: "your-guide", icon: Compass },
            { label: "Your conversation", id: "how-it-works", icon: Video },
            { label: "Your next chapter", id: "your-next-chapter", icon: ArrowUpRight },
          ].map(({ label, id, icon: Icon }, index) => (
            <a href={`#${id}`} key={id}>
              <span className={styles.chapterIcon} aria-hidden="true">
                <Icon size={20} aria-hidden="true" />
                <small>0{index + 1}</small>
              </span>
              <span className={styles.chapterLabel}>{label}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </nav>
      <div id="your-question">
        <QuestionChapter />
        <IndiaDiscovery astrologers={astrologers} ready={ready} topics={storyTopics} />
      </div>
      <section className={styles.guideSection} id="your-guide">
        <div className="container">
          <div className={styles.guideHeading}>
            <div>
              <span className={styles.chapterNumber}>02 / YOUR GUIDE</span>
              <h2>
                <span className={styles.desktopOnly}>The right person makes<br /> <em>all the difference.</em></span>
                <span className={styles.phoneOnly}>Meet your guide</span>
              </h2>
            </div>
            <div>
              <p>
                Different approaches. Thoughtful perspectives.
                <br /> Find the guide who feels right for you.
              </p>
              <Link href="/astrologers" className="text-link">
                Explore all astrologers <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className={styles.guideLayout}>
            <div className={styles.featuredLead}>
              <AstrologerCard astrologer={guide} />
              <span className={styles.featuredNote}>
                <Sparkles size={16} />A thoughtful place to begin
              </span>
            </div>
            <div className={styles.guideList}>
              {astrologers.slice(1, 4).map(astrologer => (
                <AstrologerCard key={astrologer.id} astrologer={astrologer} layout="row" />
              ))}
            </div>
          </div>
          <p className={styles.demoNote}>
            Fictional demo profiles. Ratings and badges are illustrative.
          </p>
        </div>
      </section>
      <ConversationPath astrologer={guide} />
      <section className={styles.trustRibbon} aria-label="The intended ASTRA experience">
        <div className="container">
          {[
            { icon: BadgeCheck, label: "Verified astrologers*" },
            { icon: LockKeyhole, label: "Private 1:1 sessions" },
            { icon: CalendarDays, label: "Flexible scheduling" },
            { icon: Video, label: "Secure video*" },
            { icon: CreditCard, label: "Secure payments*" },
          ].map(({ icon: Icon, label }) => (
            <span key={label}>
              <Icon size={20} strokeWidth={1.3} />
              {label}
            </span>
          ))}
        </div>
        <p>*A vision for the product. Verification, calls and payments are simulated in this demo.</p>
      </section>
      <section className={styles.voicesSection} id="your-next-chapter">
        <div className="container">
          <div className={styles.voicesHeading}>
            <span className={styles.chapterNumber}>04 / YOUR NEXT CHAPTER</span>
            <h2>
              <span className={styles.desktopOnly}>Not all clarity is loud.<br /> <em>Sometimes, it&apos;s a quiet shift.</em></span>
              <span className={styles.phoneOnly}>A little clarity</span>
            </h2>
          </div>
          <div className={styles.featuredVoice}>
            <span aria-hidden="true">&ldquo;</span>
            <blockquote>{testimonials[0]?.text}</blockquote>
            <div>
              <span className={styles.voiceInitial}>{testimonials[0]?.name.charAt(0)}</span>
              <p>
                <strong>{testimonials[0]?.name}</strong>
                <small>
                  {testimonials[0]?.city} · {testimonials[0]?.topic}
                </small>
              </p>
            </div>
          </div>
          <div className={styles.desktopOnly}>
          <MobileDisclosure id="more-client-stories" more="Read 3 more stories" less="Show fewer stories">
            <div className={styles.voiceList}>
              {testimonials.slice(1, 4).map(item => (
                <article key={item.id}>
                  <div className={styles.voiceStars} role="img" aria-label="Illustrative five-star review">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <blockquote>&ldquo;{item.text}&rdquo;</blockquote>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.city} · {item.topic}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </MobileDisclosure>
          </div>
          <p className={styles.demoNote}>
            Illustrative story, not an actual customer endorsement.
          </p>
        </div>
      </section>
      <section className={styles.ending}>
        <div className={styles.endingSun} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container">
          <Sparkles size={30} strokeWidth={1} />
          <h2>
            The next chapter
            <br /> <em>is yours.</em>
          </h2>
          <p>
            You don&apos;t need all the answers to take the first step.
            <br /> Just a question, and a little space for a conversation.
          </p>
          <Link href="/astrologers" className="btn btn-primary">
            Find your astrologer <ArrowRight size={18} />
          </Link>
          <span className={styles.endingSignature}>Clarity, one conversation away.</span>
        </div>
      </section>
    </div>
  );
});
