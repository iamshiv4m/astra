"use client";

import { useDemo } from "@/lib/store";
import { StoryHome } from "@/features/story/story-home";

export default function HomePage() {
  const { state, ready } = useDemo();
  return <StoryHome astrologers={state.astrologers} testimonials={state.testimonials} ready={ready} />;
}
