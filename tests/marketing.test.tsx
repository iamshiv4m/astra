import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { Hero } from "@/components/hero";
import { QuestionChapter, ConversationPath, StoryHome, storyTopics } from "@/features/story/story-home";
import { createSeed } from "@/lib/domain";
import { defaultFilters, filterAstrologers } from "@/features/discovery/filters";
import { IndiaDiscovery } from "@/features/story/india-discovery";
import { DemoProvider } from "@/lib/store";

it("gives every story chapter a decorative icon and an accessible section link", () => {
  const seed = createSeed("2026-09-19");
  render(
    <DemoProvider>
      <StoryHome astrologers={seed.astrologers} testimonials={seed.testimonials} ready />
    </DemoProvider>
  );
  const nav = within(screen.getByRole("navigation", { name: "Your ASTRA story" }));
  for (const [label, id] of [
    ["Your question", "your-question"],
    ["Your guide", "your-guide"],
    ["Your conversation", "how-it-works"],
    ["Your next chapter", "your-next-chapter"],
  ]) {
    const link = nav.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", `#${id}`);
    expect(link.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
    expect(document.getElementById(id)).toBeInTheDocument();
  }
});

it("makes the consultation offer and next steps clear", () => {
  render(<Hero />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your next chapter starts with a conversation.");
  expect(screen.getByRole("link", { name: /Find your astrologer/i })).toHaveAttribute("href", "/astrologers");
  expect(screen.getByRole("link", { name: /How it works/i })).toHaveAttribute("href", "/#how-it-works");
  expect(screen.getByText(/Private astrology consultations for career crossroads/i)).toBeInTheDocument();
  expect(screen.getByText(/Vedic wisdom, modern lives/i)).toBeInTheDocument();
  expect(screen.getByText(/illustrative kundli/i)).toBeInTheDocument();
});

it("keeps a moving ribbon of topics and illustrative voices after the hero", () => {
  const seed = createSeed("2026-09-19");
  render(
    <DemoProvider>
      <StoryHome astrologers={seed.astrologers} testimonials={seed.testimonials} ready />
    </DemoProvider>
  );
  const ribbon = screen.getByRole("region", { name: "Topics and illustrative voices" });
  expect(within(ribbon).getByRole("link", { name: "Career" })).toHaveAttribute("href", "/astrologers?search=Career");
  expect(within(ribbon).getByRole("link", { name: "Relationships" })).toHaveAttribute(
    "href",
    "/astrologers?search=Relationships"
  );
  expect(ribbon).toHaveTextContent(/Priya · Bengaluru/);
  expect(ribbon).toHaveTextContent(/a calmer way to think/i);
  expect(ribbon).toHaveTextContent(/illustrative voices/i);
});

it("connects Indian traditions and a preferred language to matching guides", () => {
  render(<IndiaDiscovery astrologers={createSeed("2026-09-19").astrologers} ready />);
  fireEvent.change(screen.getByRole("combobox", { name: "Consultation language" }), { target: { value: "Tamil" } });
  expect(screen.getByRole("link", { name: /Explore Vedic Astrology/ })).toHaveAttribute(
    "href",
    "/astrologers?specialty=Vedic+Astrology&language=Tamil"
  );
  expect(screen.getByRole("link", { name: /See Tamil-speaking guides/ })).toHaveAttribute(
    "href",
    "/astrologers?language=Tamil"
  );
  expect(screen.getByText("1 Tamil-speaking guide in this demo")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Explore Tarot Reading/ })).not.toBeInTheDocument();
});

it("only offers languages currently supported by the demo guides", () => {
  const guide = createSeed("2026-09-19").astrologers[0];
  render(<IndiaDiscovery astrologers={[{ ...guide, languages: ["Hindi"] }]} ready />);
  expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual(["Any language", "Hindi"]);
});

it("combines mobile topic and language choices and lets a topic be deselected", () => {
  const astrologers = createSeed("2026-09-19").astrologers;
  render(<IndiaDiscovery astrologers={astrologers} ready topics={storyTopics} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Consultation language" }), { target: { value: "Hindi" } });
  fireEvent.click(screen.getByRole("button", { name: "Relationships" }));
  const count = filterAstrologers(astrologers, { ...defaultFilters, search: "Relationships", language: "Hindi" }).length;
  expect(screen.getByRole("link", { name: `Show ${count} matching ${count === 1 ? "guide" : "guides"}` }))
    .toHaveAttribute("href", "/astrologers?search=Relationships&language=Hindi");
  fireEvent.click(screen.getByRole("button", { name: "Relationships" }));
  expect(screen.getByRole("link", { name: /Show \d+ matching guides?/ })).toHaveAttribute("href", "/astrologers?language=Hindi");
});

it("explains empty mobile matches instead of sending users to an unrelated result", () => {
  const guide = createSeed("2026-09-19").astrologers[0];
  render(<IndiaDiscovery astrologers={[{ ...guide, expertise: ["Career"], specialty: "Vedic Astrology" }]} ready topics={storyTopics} />);
  fireEvent.click(screen.getByRole("button", { name: "Family" }));
  expect(screen.getByText(/No demo guide matches this topic and language/)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Show \d+ matching guides?/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse all guides" })).toHaveAttribute("href", "/astrologers");
});

it("does not accept a language choice until the demo is hydrated", () => {
  const astrologers = createSeed("2026-09-19").astrologers;
  const view = render(<IndiaDiscovery astrologers={astrologers} ready={false} />);
  expect(screen.getByRole("combobox", { name: "Consultation language" })).toBeDisabled();
  view.rerender(<IndiaDiscovery astrologers={astrologers} ready />);
  expect(screen.getByRole("combobox", { name: "Consultation language" })).toBeEnabled();
  fireEvent.change(screen.getByRole("combobox", { name: "Consultation language" }), { target: { value: "Tamil" } });
  expect(screen.getByText("1 Tamil-speaking guide in this demo")).toBeInTheDocument();
});

it("lets visitors choose the question that starts their story", () => {
  render(<QuestionChapter />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Life doesn't come with a straight line.");
  fireEvent.click(screen.getByRole("button", { name: "Relationships" }));
  expect(screen.getByRole("button", { name: "Relationships" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link", { name: /Find guidance for relationships/i })).toHaveAttribute(
    "href",
    "/astrologers?search=Relationships"
  );
  expect(screen.getByText("Some connections need a new perspective.")).toBeInTheDocument();
});

it("reveals the consultation journey one meaningful step at a time", () => {
  const astrologer = createSeed("2026-09-19").astrologers[0];
  render(<ConversationPath astrologer={astrologer} />);
  fireEvent.click(screen.getByRole("tab", { name: /Meet over video/i }));
  expect(screen.getByRole("tab", { name: /Meet over video/i })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("A real conversation. Room for every question.");
  expect(screen.getByRole("link", { name: /Begin your conversation/i })).toHaveAttribute("href", "/astrologers");
});

it("has matching guides for every story topic", () => {
  const advisors = createSeed("2026-09-19").astrologers;
  for (const topic of storyTopics) {
    expect(filterAstrologers(advisors, { ...defaultFilters, search: topic.search }).length).toBeGreaterThan(0);
  }
});

it("supports arrow-key and Home/End navigation through the consultation story", () => {
  render(<ConversationPath astrologer={createSeed("2026-09-19").astrologers[0]} />);
  const first = screen.getByRole("tab", { name: /Choose your guide/ });
  first.focus();
  fireEvent.keyDown(first, { key: "ArrowDown" });
  const second = screen.getByRole("tab", { name: /Choose your moment/ });
  expect(second).toHaveFocus();
  expect(second).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(second, { key: "End" });
  const last = screen.getByRole("tab", { name: /Meet over video/ });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: "Home" });
  expect(first).toHaveFocus();
});
