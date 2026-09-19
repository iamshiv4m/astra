"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BriefcaseBusiness, Languages } from "lucide-react";
import type { Astrologer } from "@/types/domain";
import { useDemo } from "@/lib/store";
import { dateKey, getSlots, money } from "@/lib/domain";
import { Stars } from "./ui";

export function AstrologerCard({ astrologer, layout = "card" }: { astrologer: Astrologer; layout?: "card" | "row" }) {
  const { state, ready } = useDemo();
  const available = ready && getSlots(state, astrologer.id, dateKey(state.now), 30).some(s => s.available);
  const duration = astrologer.id === "raghav-mehta" ? 45 : 30;
  return (
    <article className={`astrologer-card${layout === "row" ? " advisor-row" : ""}`}>
      <Link
        href={`/astrologers/${astrologer.id}`}
        aria-label={`View ${astrologer.name}'s profile`}
        className="advisor-portrait"
        style={{ display: "block" }}
      >
        <Image
          src={astrologer.image}
          alt={astrologer.name}
          width={500}
          height={400}
          sizes="(max-width: 500px) 100vw, (max-width: 1100px) 45vw, 25vw"
        />
        <span className="portrait-status">
          <span className="status-dot" />
          {available ? "Available today" : "Private consultation"}
        </span>
        <span className="portrait-rating">
          <Stars rating={astrologer.rating} />
        </span>
      </Link>
      <div className="advisor-info">
        <h3>
          <Link href={`/astrologers/${astrologer.id}`}>{astrologer.name}</Link>
          <BadgeCheck size={16} aria-label="Sample verified advisor" />
        </h3>
        <p className="advisor-specialty">{astrologer.specialty}</p>
        <p className="advisor-meta">
          <BriefcaseBusiness size={13} />
          {astrologer.experience}+ years experience
        </p>
        <p className="advisor-meta">
          <Languages size={13} />
          {astrologer.languages.join(" · ")}
        </p>
        <p className="advisor-meta">
          {astrologer.consultations.toLocaleString("en-IN")}+ consultations · Sample history
        </p>
        <div className="advisor-price">
          <div>
            <strong>{money(astrologer.prices[duration])}</strong>
            <span className="muted"> / {duration} min</span>
          </div>
          <Link className="text-link" href={`/astrologers/${astrologer.id}`}>
            View profile <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
