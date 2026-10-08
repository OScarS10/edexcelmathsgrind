"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Plus, Search, X } from "lucide-react";
import { BOOK_CHAPTERS, CHAPTER_BOOKS, findTopicByChapter } from "@/data/chapters/edexcel-chapters";
import { EdexcelTopic, Level } from "@/types/question";

type YearKey = "all" | Level;

const MODULE_NAME: Record<string, string> = {
  pure: "Pure Mathematics",
  stats: "Statistics",
  mechanics: "Mechanics",
};

const MODULE_STYLES: Record<string, string> = {
  "Pure Mathematics": "border-blue-300 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30",
  Statistics: "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30",
  Mechanics: "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30",
};

const MODULE_ACCENT: Record<string, string> = {
  "Pure Mathematics": "text-blue-700 dark:text-blue-300",
  Statistics: "text-emerald-700 dark:text-emerald-300",
  Mechanics: "text-amber-700 dark:text-amber-300",
};

const BOOK_MODULE: Record<string, string> = {
  pure1: "Pure Mathematics",
  pure2: "Pure Mathematics",
  sm1: "Statistics",
  sm2: "Statistics",
};

const HIGH_YIELD = [
  "Algebra and functions",
  "Differentiation",
  "Integration",
  "Trigonometry",
  "Probability",
  "Statistical distributions",
];

interface SearchApiResult {
  topic: EdexcelTopic;
  relevance: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searchResult, setSearchResult] = useState<{
    q: string;
    results: SearchApiResult[];
  } | null>(null);
  const [activeYear, setActiveYear] = useState<YearKey>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleChapter = (chapter: string) =>
    setSelected((prev) =>
      prev.includes(chapter)
        ? prev.filter((ch) => ch !== chapter)
        : [...prev, chapter]
    );

  const practiseSelectedHref = `/practice?${selected
    .map((ch) => `chapter=${encodeURIComponent(ch)}`)
    .join("&")}`;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSearchResult({ q: debounced, results: data.results || [] });
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResult({ q: debounced, results: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const showSearch = debounced !== "";
  const loading = showSearch && (!searchResult || searchResult.q !== debounced);
  const results = showSearch
    ? searchResult && searchResult.q === debounced
      ? searchResult.results
      : []
    : null;

  const bookSections = useMemo(
    () =>
      CHAPTER_BOOKS.filter((b) => activeYear === "all" || b.level === activeYear)
        .map((book) => ({
          book,
          chapters: BOOK_CHAPTERS.filter((c) => c.book === book.id),
        }))
        .filter((s) => s.chapters.length > 0),
    [activeYear]
  );

  const totalTopics = BOOK_CHAPTERS.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Chapters & topics</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Search the full Edexcel A-Level specification — {totalTopics} topics
        across Pure, Statistics and Mechanics.
      </p>

      <div className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search: quadratics, chain rule, hypothesis testing…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search chapters"
          />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
          <span className="text-sm font-medium">
            {selected.length} chapter{selected.length === 1 ? "" : "s"} selected:
          </span>
          {selected.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {ch}
              <button
                onClick={() => toggleChapter(ch)}
                aria-label={`Remove ${ch}`}
                className="text-zinc-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Link
            href={practiseSelectedHref}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <BookOpen className="h-3.5 w-3.5" /> Practise selected
          </Link>
        </div>
      )}

      {results !== null ? (
        <div className="mt-6">
          <p className="mb-3 text-sm text-zinc-500">
            {loading
              ? "Searching…"
              : `${results.length} result${results.length === 1 ? "" : "s"} for “${debounced}”`}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((r, i) => (
              <div
                key={`${r.topic.id}-${i}`}
                className={`rounded-lg border p-4 ${MODULE_STYLES[r.topic.module === "pure" ? "Pure Mathematics" : r.topic.module === "stats" ? "Statistics" : "Mechanics"]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{r.topic.name}</p>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    r.topic.level === "year1"
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200"
                      : "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200"
                  }`}>
                    Y{r.topic.level === "year1" ? "1" : "2"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {r.topic.chapter} — {r.topic.section}
                </p>
                <div className="mt-3">
                  <Link
                    href={`/practice?chapter=${encodeURIComponent(r.topic.chapter)}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Practise this chapter
                  </Link>
                </div>
              </div>
            ))}
            {results.length === 0 && !loading && (
              <p className="text-zinc-500">
                No topics match. Try a broader term like “algebra”.
              </p>
            )}
          </div>
          <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
            Back to browsing
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all" as YearKey, label: "All years" },
                { value: "year1" as YearKey, label: "Year 1 / AS" },
                { value: "year2" as YearKey, label: "Year 2" },
              ]
            ).map((y) => (
              <button
                key={y.value}
                onClick={() => setActiveYear(y.value)}
                className={`h-11 rounded-md border px-4 text-sm font-medium transition-colors ${
                  activeYear === y.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                }`}
                aria-pressed={activeYear === y.value}
              >
                {y.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-8">
            {bookSections.map(({ book, chapters }) => {
              const accent = BOOK_MODULE[book.id];
              return (
                <section key={book.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className={`text-lg font-bold ${MODULE_ACCENT[accent] ?? ""}`}>
                      {book.title}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {chapters.length} chapter{chapters.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {chapters.map((c) => {
                      const style =
                        MODULE_STYLES[MODULE_NAME[c.module]] ?? "";
                      const isSelected = selected.includes(c.chapter);
                      return (
                        <div
                          key={c.id}
                          className={`rounded-lg border p-4 transition-shadow hover:shadow-sm ${style} ${
                            isSelected ? "ring-2 ring-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-snug">
                              <span className="mr-1.5 text-zinc-400">
                                {c.number}.
                              </span>
                              {c.name}
                            </p>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                c.level === "year1"
                                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200"
                                  : "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200"
                              }`}
                            >
                              Y{c.level === "year1" ? "1" : "2"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {c.section} · {findTopicByChapter(c.chapter).specCode}
                          </p>
                          {HIGH_YIELD.includes(c.chapter) && (
                            <p className="mt-1">
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                High yield
                              </span>
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => toggleChapter(c.chapter)}
                            aria-pressed={isSelected}
                            className={`flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            {isSelected ? "Selected" : "Select"}
                          </button>
                          <Link
                            href={`/practice?chapter=${encodeURIComponent(c.chapter)}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                          >
                            <BookOpen className="h-3.5 w-3.5" /> Practise
                          </Link>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
