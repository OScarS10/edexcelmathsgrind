"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Braces,
  ChartArea,
  CircleDot,
  Gauge,
  Infinity,
  LineChart,
  ListOrdered,
  LucideIcon,
  MoveUpRight,
  Puzzle,
  TrendingUp,
  Triangle,
} from "lucide-react";
import {
  SKILL_FAMILIES,
  SKILLS,
  SkillFamily,
  Skill,
} from "@/data/skills";
import { parseProfile, useProfileSnapshot } from "@/lib/profile/student-profile";

const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  ChartArea,
  LineChart,
  Braces,
  Triangle,
  Infinity,
  ListOrdered,
  MoveUpRight,
  CircleDot,
  BarChart3,
  Gauge,
  Puzzle,
};

const FAMILY_ACCENT: Record<SkillFamily, { text: string; border: string; badge: string }> = {
  pure: {
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200",
  },
  applied: {
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200",
  },
  reasoning: {
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-900",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200",
  },
};

function levelLabel(level: Skill["level"]): string {
  if (level === "both") return "Y1 + Y2";
  return level === "year1" ? "Year 1" : "Year 2";
}

export default function SkillsPage() {
  const profileRaw = useProfileSnapshot();
  const profile = useMemo(() => parseProfile(profileRaw), [profileRaw]);

  const mastery = useMemo(() => {
    const map = new Map<string, { seen: number; correct: number }>();
    for (const skill of SKILLS) {
      let seen = 0;
      let correct = 0;
      for (const a of profile.attempts) {
        if (skill.chapters.includes(a.chapter)) {
          seen++;
          correct += a.correct ? 1 : 0;
        }
      }
      map.set(skill.id, { seen, correct });
    }
    return map;
  }, [profile.attempts]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Skills gym</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Chapters tell you <em>where</em> content lives; skills are the reusable
        techniques that show up across the paper — sketching graphs,
        differentiating, integrating, setting up a probability model. Drill one
        here, then pick a difficulty, question count and timing on the practice
        screen.
      </p>

      {SKILL_FAMILIES.map((family) => {
        const accent = FAMILY_ACCENT[family.id];
        const skills = SKILLS.filter((s) => s.family === family.id);
        return (
          <section
            key={family.id}
            className="mt-10"
            aria-labelledby={`family-${family.id}`}
          >
            <h2
              id={`family-${family.id}`}
              className={`text-lg font-bold ${accent.text}`}
            >
              {family.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {family.blurb}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => {
                const stats = mastery.get(skill.id) ?? { seen: 0, correct: 0 };
                const pct =
                  stats.seen > 0 ? Math.round((stats.correct / stats.seen) * 100) : null;
                const Icon = ICONS[skill.icon] ?? TrendingUp;
                return (
                  <Link
                    key={skill.id}
                    href={`/practice?skill=${skill.id}`}
                    className={`group flex flex-col rounded-lg border bg-white p-5 transition-shadow hover:shadow-sm ${accent.border} dark:bg-zinc-900/60`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md ${accent.badge}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.badge}`}
                        >
                          {levelLabel(skill.level)}
                        </span>
                        {skill.highYield && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                            High yield
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 font-semibold">{skill.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {skill.blurb}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Draws on: {skill.chapters.join(", ")}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                      <div className="flex-1">
                        {pct === null ? (
                          <p className="text-xs text-zinc-500">No attempts yet</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500">Mastery</span>
                              <span className="font-semibold">{pct}%</span>
                            </div>
                            <div
                              className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${skill.name} mastery`}
                            >
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {stats.seen} attempt{stats.seen === 1 ? "" : "s"}
                            </p>
                          </>
                        )}
                      </div>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                        aria-hidden
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}