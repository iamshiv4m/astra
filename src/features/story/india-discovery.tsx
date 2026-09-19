"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, Compass, Grid2X2, Hash, Layers } from "lucide-react";
import type { Astrologer } from "@/types/domain";
import { defaultFilters, filterAstrologers } from "@/features/discovery/filters";
import styles from "./india-discovery.module.css";

const traditions = [
  {
    name: "Vedic Astrology",
    title: "Your kundli. A wider perspective.",
    description: "Explore birth-chart themes, life transitions and the questions that matter now.",
    icon: Compass,
  },
  {
    name: "Tarot Reading",
    title: "A fresh way to reflect.",
    description: "Turn symbols into thoughtful prompts for relationships and self-discovery.",
    icon: Layers,
  },
  {
    name: "Numerology",
    title: "Find meaning in your patterns.",
    description: "A different lens on names, dates and the cycles you notice in your life.",
    icon: Hash,
  },
  {
    name: "Vastu",
    title: "Make room for a new energy.",
    description: "Talk through traditional perspectives on the spaces you live and work in.",
    icon: Grid2X2,
  },
];

export function IndiaDiscovery({
  astrologers,
  ready,
  topics = [],
}: {
  astrologers: Astrologer[];
  ready: boolean;
  topics?: { label: string; search: string }[];
}) {
  const [language, setLanguage] = useState("");
  const [topic, setTopic] = useState("");
  const [descriptionsOpen, setDescriptionsOpen] = useState(false);
  const languages = [...new Set(astrologers.flatMap(guide => guide.languages))].sort();
  const matching = astrologers.filter(guide => !language || guide.languages.includes(language));
  const languageQuery = new URLSearchParams(language ? { language } : {});
  const quickMatches = filterAstrologers(astrologers, { ...defaultFilters, search: topic, language });
  const quickQuery = new URLSearchParams({ ...(topic ? { search: topic } : {}), ...(language ? { language } : {}) });
  return (
    <section className={styles.section} id="your-language">
      <div className="container">
        <div className={styles.heading}>
          <div className={styles.introduction}>
            <h2>
              Rooted in India.
              <br /> <em>Personal to you.</em>
            </h2>
            <p>
              From kundli conversations to a fresh perspective on everyday life.
              <br /> Explore an approach that feels like you.
            </p>
          </div>
          <div className={styles.quickTopics}>
            <h2>What brings you here?</h2>
            <div role="group" aria-label="Choose your topic">
              {topics.map(item => (
                <button
                  key={item.search}
                  type="button"
                  disabled={!ready}
                  aria-pressed={topic === item.search}
                  onClick={() => setTopic(current => current === item.search ? "" : item.search)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.languageChoice}>
            <AudioLines size={25} />
            <label htmlFor="consultation-language">Consultation language</label>
            <select
              id="consultation-language"
              disabled={!ready}
              value={language}
              onChange={event => setLanguage(event.target.value)}
            >
              <option value="">Any language</option>
              {languages.map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <span>{ready ? "Apni bhasha. Apni baat." : "Loading your demo guides..."}</span>
          </div>
          <div className={styles.quickAction} aria-live="polite">
            {!ready ? <p>Loading your demo guides...</p> : quickMatches.length > 0 ? (
              <Link className="btn btn-primary" href={`/astrologers${quickQuery.size ? `?${quickQuery}` : ""}`}>
                Show {quickMatches.length} matching {quickMatches.length === 1 ? "guide" : "guides"} <ArrowRight size={16} />
              </Link>
            ) : (
              <><p>No demo guide matches this topic and language. Try another choice.</p><Link href="/astrologers">Browse all guides <ArrowRight size={16} /></Link></>
            )}
          </div>
        </div>
        <button
          className={styles.descriptionToggle}
          type="button"
          aria-expanded={descriptionsOpen}
          aria-controls="tradition-choices"
          onClick={() => setDescriptionsOpen(value => !value)}
        >
          {descriptionsOpen ? "Hide astrology approaches" : "Explore astrology approaches"}
          <span aria-hidden="true">{descriptionsOpen ? "−" : "+"}</span>
        </button>
        <div id="tradition-choices" className={styles.traditions} data-descriptions={descriptionsOpen}>
          {traditions.map(({ name, title, description, icon: Icon }, index) => {
            const count = matching.filter(guide => guide.specialty === name).length;
            const query = new URLSearchParams({ specialty: name, ...(language ? { language } : {}) });
            return (
              <article key={name} className={styles.tradition} data-tone={index}>
                <div className={styles.traditionIcon}>
                  <Icon size={28} strokeWidth={1.5} />
                  <span>{name}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                {count > 0 ? (
                  <Link href={`/astrologers?${query}`} aria-label={`Explore ${name}`}>
                    <span>
                      {count} demo {count === 1 ? "guide" : "guides"}
                    </span>
                    <ArrowUpRight size={20} />
                  </Link>
                ) : (
                  <span className={styles.noMatch}>No {language} guide in this demo</span>
                )}
              </article>
            );
          })}
        </div>
        <div className={styles.footer}>
          <p aria-live="polite">
            {matching.length} {language ? `${language}-speaking` : "multilingual"}{" "}
            {matching.length === 1 ? "guide" : "guides"} in this demo
          </p>
          <Link href={`/astrologers${language ? `?${languageQuery}` : ""}`}>
            See {language ? `${language}-speaking` : "all"} guides <ArrowRight size={16} />
          </Link>
        </div>
        <p className={styles.disclaimer}>
          Languages describe fictional guide profiles, not an interface translation. All consultations are simulated.
        </p>
      </div>
    </section>
  );
}
