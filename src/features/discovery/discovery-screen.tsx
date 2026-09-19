"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ShieldCheck, Video, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AstrologerCard } from "@/components/astrologer-card";
import { EmptyState, ErrorNotice, LoadingState, Modal } from "@/components/ui";
import { addDays, dateKey, getSlots } from "@/lib/domain";
import { useDemo } from "@/lib/store";
import { defaultFilters, filterAstrologers, type DiscoveryFilters } from "./filters";
import styles from "./discovery.module.css";

const filterNames: Record<string, string> = {
  search: "Search",
  specialty: "Astrology",
  experience: "Experience",
  language: "Language",
  price: "Price",
  rating: "Rating",
  availability: "Availability",
  gender: "Gender",
};

export function DiscoveryScreen() {
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const specialty = params.get("specialty") ?? "";
  const language = params.get("language") ?? "";
  return (
    <DiscoveryResults
      key={JSON.stringify([search, specialty, language])}
      initialFilters={{ search, specialty, language }}
    />
  );
}

function DiscoveryResults({
  initialFilters,
}: {
  initialFilters: Pick<DiscoveryFilters, "search" | "specialty" | "language">;
}) {
  const { state, ready, error, actions } = useDemo();
  const [filters, setFilters] = useState<DiscoveryFilters>(() => ({ ...defaultFilters, ...initialFilters }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const today = dateKey(state.now);
  const active = Object.entries(filters).filter(([key, value]) => key !== "sort" && value !== "");
  const specialties = Array.from(new Set(state.astrologers.map(advisor => advisor.specialty))).sort();
  const languages = Array.from(new Set(state.astrologers.flatMap(advisor => advisor.languages))).sort();
  const availableIds = useMemo(() => {
    if (!filters.availability) return new Set<string>();
    const days = filters.availability === "today" ? 1 : 7;
    return new Set(
      state.astrologers
        .filter(advisor =>
          Array.from({ length: days }, (_, day) => addDays(today, day)).some(date =>
            getSlots(state, advisor.id, date, 30).some(slot => slot.available)
          )
        )
        .map(advisor => advisor.id)
    );
  }, [filters.availability, state, today]);
  const results = state.scenario === "empty" ? [] : filterAstrologers(state.astrologers, filters, availableIds);

  function update(key: keyof DiscoveryFilters, value: string) {
    setFilters(current => ({ ...current, [key]: value }));
  }
  function reset() {
    setFilters(defaultFilters);
  }
  function chipValue(key: string, value: string) {
    if (key === "experience") return `${value}+ years`;
    if (key === "price") return `Up to ₹${Number(value).toLocaleString("en-IN")}`;
    if (key === "rating") return `${value}+ stars`;
    if (key === "availability") return value === "today" ? "Today" : "This week";
    return value;
  }
  function filterFields() {
    return (
      <div className={styles.filterFields}>
        <label>
          Astrology type
          <select
            className="select"
            value={filters.specialty}
            onChange={event => update("specialty", event.target.value)}
          >
            <option value="">All types</option>
            {specialties.map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Experience
          <select
            className="select"
            value={filters.experience}
            onChange={event => update("experience", event.target.value)}
          >
            <option value="">Any experience</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
            <option value="15">15+ years</option>
          </select>
        </label>
        <label>
          Language
          <select
            className="select"
            value={filters.language}
            onChange={event => update("language", event.target.value)}
          >
            <option value="">All languages</option>
            {languages.map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Price per 30 minutes
          <select className="select" value={filters.price} onChange={event => update("price", event.target.value)}>
            <option value="">Any price</option>
            <option value="1000">Up to ₹1,000</option>
            <option value="1500">Up to ₹1,500</option>
            <option value="2000">Up to ₹2,000</option>
          </select>
        </label>
        <label>
          Rating
          <select className="select" value={filters.rating} onChange={event => update("rating", event.target.value)}>
            <option value="">All ratings</option>
            <option value="4.5">4.5 stars & above</option>
            <option value="4.8">4.8 stars & above</option>
            <option value="4.9">4.9 stars & above</option>
          </select>
        </label>
        <label>
          Availability
          <select
            className="select"
            value={filters.availability}
            onChange={event => update("availability", event.target.value)}
          >
            <option value="">Any availability</option>
            <option value="today">Available today</option>
            <option value="week">Available this week</option>
          </select>
        </label>
        <label>
          Gender
          <select className="select" value={filters.gender} onChange={event => update("gender", event.target.value)}>
            <option value="">Any gender</option>
            <option>Female</option>
            <option>Male</option>
          </select>
        </label>
      </div>
    );
  }

  return (
    <div>
      <section className={styles.intro}>
        <div className={`container ${styles.introInner}`}>
          <div>
            <h1>
              Your questions.
              <br /> The right guide.
            </h1>
            <p>
              Vedic astrology, tarot, numerology and more.
              <br className={styles.desktopBreak} /> Connect in a language that feels like home.
            </p>
          </div>
          <div className={styles.introProof}>
            <span>
              <ShieldCheck size={17} aria-hidden="true" /> Curated demo profiles
            </span>
            <span>
              <Video size={17} aria-hidden="true" /> Private video consultations
            </span>
          </div>
          <div className={styles.introOrbit} aria-hidden="true">
            <span>✦</span>
          </div>
        </div>
      </section>
      <div className={`container ${styles.directory}`}>
        <aside className={styles.sidebar} aria-label="Filter astrologers">
          <div className={styles.filterTitle}>
            <h2>
              <SlidersHorizontal size={17} aria-hidden="true" /> Filters
            </h2>
            <button onClick={reset} disabled={!active.length}>
              Reset all
            </button>
          </div>
          {filterFields()}
          <p className={styles.filterNote}>Availability is shown in IST and reflects your current demo schedule.</p>
        </aside>
        <section className={styles.results} aria-label="Astrologer results">
          <div className={styles.searchRow}>
            <label className={styles.search}>
              <Search size={19} aria-hidden="true" />
              <span className={styles.srOnly}>Search astrologers by name or expertise</span>
              <input
                type="search"
                value={filters.search}
                onChange={event => update("search", event.target.value)}
                placeholder="Search by name or expertise…"
              />
              {filters.search && (
                <button aria-label="Clear search" onClick={() => update("search", "")}>
                  <X size={16} />
                </button>
              )}
            </label>
            <button className={`btn btn-secondary ${styles.mobileFilter}`} onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={17} aria-hidden="true" /> Filters{active.length ? ` (${active.length})` : ""}
            </button>
          </div>
          <div className={styles.resultsToolbar}>
            <p aria-live="polite">
              <strong>
                {!ready || state.scenario === "loading"
                  ? "Finding your guides…"
                  : `${results.length} astrologer${results.length === 1 ? "" : "s"}`}
              </strong>
              {ready && state.scenario !== "loading" && <span className="muted"> for your journey</span>}
            </p>
            <label className={styles.sort}>
              <span>Sort by</span>
              <select value={filters.sort} onChange={event => update("sort", event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="rating">Highest rated</option>
                <option value="experience">Most experienced</option>
                <option value="price">Price: low to high</option>
              </select>
            </label>
          </div>
          {active.length > 0 && (
            <div className={styles.chips}>
              {active.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => update(key as keyof DiscoveryFilters, "")}
                  aria-label={`Remove ${filterNames[key]}: ${chipValue(key, value)}`}
                >
                  {chipValue(key, value)}
                  <X size={12} aria-hidden="true" />
                </button>
              ))}
              <button className={styles.clearAll} onClick={reset}>
                Clear all
              </button>
            </div>
          )}
          {!ready || state.scenario === "loading" ? (
            <div className="stack">
              <LoadingState />
              {ready && (
                <button className="btn btn-secondary" onClick={() => actions.setScenario("normal")}>
                  Finish loading demo
                </button>
              )}
            </div>
          ) : error || state.scenario === "error" ? (
            <div className="stack">
              <ErrorNotice message={error || "We couldn’t load your guides. Please try again."} />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  actions.clearError();
                  actions.setScenario("normal");
                }}
              >
                Try again
              </button>
            </div>
          ) : results.length ? (
            <div className={styles.advisorGrid}>
              {results.map(advisor => (
                <AstrologerCard key={advisor.id} astrologer={advisor} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <EmptyState
                title="Your guide is out there."
                description="We couldn’t find an astrologer matching these preferences. Try a different search or make a little room in your filters."
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  reset();
                  actions.setScenario("normal");
                }}
              >
                Show all astrologers <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          <p className={styles.sampleNotice}>
            All astrologers, ratings and reviews are fictional sample content for this prototype.
          </p>
          <div className={styles.helpStrip}>
            <div>
              <h2>Not sure where to begin?</h2>
              <p>Explore how a personal consultation works, at your own pace.</p>
            </div>
            <Link href="/#how-it-works">
              How it works <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
      <Modal open={filtersOpen} onOpenChange={setFiltersOpen} title="Find your guide">
        {filterFields()}
        <div className={styles.modalActions}>
          <button className="btn btn-secondary" onClick={reset}>
            Reset filters
          </button>
          <button className="btn btn-primary" onClick={() => setFiltersOpen(false)}>
            Show {results.length} astrologers
          </button>
        </div>
      </Modal>
    </div>
  );
}
