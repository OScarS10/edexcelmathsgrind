import { ALL_CHAPTERS } from "@/data/chapters/edexcel-chapters";
import { specForChapter } from "@/data/chapters/spec-map";
import { EdexcelTopic } from "@/types/question";

export interface SearchResult {
  topic: EdexcelTopic;
  relevance: number;
}

export class ChapterSearch {
  search(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return ALL_CHAPTERS.map((t) => ({ topic: t, relevance: 1 }));

    const words = normalizedQuery.split(/\s+/);

    const results = ALL_CHAPTERS.map((topic) => {
      let relevance = 0;
      if (topic.name.toLowerCase().includes(normalizedQuery)) relevance += 0.5;
      if (topic.chapter.toLowerCase().includes(normalizedQuery)) relevance += 0.4;
      if (topic.section.toLowerCase().includes(normalizedQuery)) relevance += 0.3;
      if (topic.module.toLowerCase().includes(normalizedQuery)) relevance += 0.2;
      if (words.some((word) => topic.name.toLowerCase().includes(word))) {
        relevance += 0.1;
      }
      // Spec-point titles ("chain rule", "p-values"…) live in the spec map,
      // not the topic list — match them too so exam-pointers are findable.
      const specTitles = specForChapter(topic.chapter)
        .specPoints.map((p) => p.title.toLowerCase())
        .join(" | ");
      if (relevance === 0 && specTitles.includes(normalizedQuery)) relevance += 0.35;
      if (relevance === 0 && words.some((word) => specTitles.includes(word))) {
        relevance += 0.15;
      }
      return { topic, relevance };
    });

    return results
      .filter((r) => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20);
  }

  searchByChapter(chapter: string): EdexcelTopic[] {
    return ALL_CHAPTERS.filter(
      (t) => t.chapter.toLowerCase() === chapter.toLowerCase()
    );
  }

  getAllChapters(): string[] {
    return Array.from(new Set(ALL_CHAPTERS.map((t) => t.chapter)));
  }

  getModules(): string[] {
    return ["Pure Mathematics", "Statistics", "Mechanics"];
  }
}
