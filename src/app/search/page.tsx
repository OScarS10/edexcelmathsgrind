"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import { EDEXCEL_ALEVEL_CHAPTERS } from "@/data/chapters/edexcel-chapters";
import { EdexcelTopic } from "@/types/question";

type ModuleKey = "all" | "Pure Mathematics" | "Statistics" | "Mechanics";

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
  const [activeModule, setActiveModule] = useState<ModuleKey>("all");

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

  const grouped = useMemo(() => {
    const entries = Object.entries(EDEXCEL_ALEVEL_CHAPTERS);
    if (activeModule === "all") return entries;
    return entries.filter(([name]) => name === activeModule);
  }, [activeModule]);

  const totalTopics = useMemo(
    () => Object.values(EDEXCEL_ALEVEL_CHAPTERS).flat().length,
    []
  );

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
                <p className="font-semibold">{r.topic.name}</p>
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
              ["all", "Pure Mathematics", "Statistics", "Mechanics"] as ModuleKey[]
            ).map((m) => (
              <button
                key={m}
                onClick={() => setActiveModule(m)}
                className={`h-11 rounded-md border px-4 text-sm font-medium transition-colors ${
                  activeModule === m
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                }`}
                aria-pressed={activeModule === m}
              >
                {m === "all" ? "All modules" : m}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-8">
            {grouped.map(([moduleName, topics]) => (
              <section key={moduleName}>
                <h2
                  className={`text-lg font-bold ${MODULE_ACCENT[moduleName] ?? ""}`}
                >
                  {moduleName}
                </h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-lg border p-4 transition-shadow hover:shadow-sm ${MODULE_STYLES[moduleName] ?? ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-snug">{t.name}</p>
                        {HIGH_YIELD.includes(t.chapter) && (
                          <span
                            className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                            title="High weight on the Edexcel papers (Pareto principle)"
                          >
                            High yield
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {t.section} · {t.specCode}
                      </p>
                      <Link
                        href={`/practice?chapter=${encodeURIComponent(t.chapter)}`}
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Practise
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
