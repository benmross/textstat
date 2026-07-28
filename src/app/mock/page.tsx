"use client";

import { Slideshow } from "@/components/story/Slideshow";
import { MOCK_STATS } from "@/lib/mock-stats";

export default function MockStoryPage() {
  return <Slideshow stats={MOCK_STATS} />;
}
