"use client";

import { useRef, useState, ReactNode } from "react";
import { GeneratedQuestion } from "@/types/question";
import { MathText } from "@/components/ui/math-text";
import { Hint } from "@/lib/learning/hints";
import { MarkAward, StepVerdict, summariseAward } from "@/lib/exam/mark-scheme";
import {
  Camera,
  CheckCircle,
  ChevronDown,
  Eye,
  Lightbulb,
  Lock,
  Sparkles,
} from "lucide-react";

/* ------------------------------- Hint ladder ------------------------------ */

export function HintLadder({
  hints,
  maxDepth,
  revealed,
  onReveal,
  onShowSolution,
  solutionOpen,
  hintsAllowed,
}: {
  hints: Hint[];
  maxDepth: number;
  revealed: number;
  onReveal: () => void;
  onShowSolution: () => void;
  solutionOpen: boolean;
  hintsAllowed: boolean;
}) {
  const available = hints.slice(0, maxDepth);
  const next = available.find((h) => h.depth > revealed);

  if (solutionOpen) return null;

  return (
    <div className="mt-4 rounded-md border border-amber-300 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
        <Lightbulb className="h-4 w-4" />
        Stuck? Take a nudge, not the answer.
      </div>

      <div className="mt-2 space-y-2">
        {available
          .filter((h) => h.depth <= revealed)
          .map((h) => (
            <p key={h.depth} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <MathText>{h.text}</MathText>
            </p>
          ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {next && hintsAllowed && (
          <button
            onClick={onReveal}
            className="flex h-10 items-center gap-1.5 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Hint {next.depth} of {available.length}
          </button>
        )}
        {!hintsAllowed && (
          <span className="flex h-10 items-center gap-1.5 rounded-md border border-amber-300 px-3 text-xs font-medium text-amber-800 dark:border-amber-700 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" /> No hints in strict exam conditions
          </span>
        )}
        <button
          onClick={onShowSolution}
          className="flex h-10 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <Eye className="h-3.5 w-3.5" /> Show the solution
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Attempt-first gate --------------------------- */

export function AttemptGate({ attempted }: { attempted: boolean }) {
  if (attempted) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
      <Lock className="h-3 w-3" /> Submit an attempt first — hints unlock after a
      genuine try.
    </p>
  );
}

/* --------------------------- Confidence picker ---------------------------- */

const CONFIDENCE = [
  { value: 1, label: "Lost", hint: "no idea" },
  { value: 2, label: "Shaky", hint: "guessed part" },
  { value: 3, label: "Sure", hint: "followed it" },
  { value: 4, label: "Solid", hint: "could teach it" },
];

export function ConfidencePicker({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        How sure were you?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CONFIDENCE.map((c) => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`h-10 rounded-md border px-3 text-sm font-medium transition-colors ${
              value === c.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            }`}
            title={c.hint}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Mark awards ------------------------------- */

const TYPE_COLOUR: Record<string, string> = {
  M: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  dM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  B: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function MarkAwardPanel({ award }: { award: MarkAward }) {
  const full = award.totalAwarded === award.totalAvailable;
  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Mark scheme
        </span>
        <span
          className={`text-sm font-bold ${full ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}
        >
          {summariseAward(award)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {award.components.map((c, i) => (
          <span
            key={i}
            title={c.reason}
            className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
              c.earned
                ? TYPE_COLOUR[c.type]
                : "bg-zinc-200 text-zinc-500 line-through dark:bg-zinc-800"
            }`}
          >
            {c.type}
            {c.marks}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Step verdicts ------------------------------ */

export function StepVerdictList({ steps }: { steps: StepVerdict[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Your working, checked line by line
      </p>
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              s.verdict === "final" || s.verdict === "match"
                ? "bg-emerald-600 text-white"
                : s.verdict === "unchecked"
                  ? "bg-zinc-400 text-white"
                  : "bg-red-500 text-white"
            }`}
            title={s.note}
          >
            {s.verdict === "final" || s.verdict === "match" ? "✓" : s.verdict === "unchecked" ? "○" : "?"}
          </span>
          <span className="text-zinc-700 dark:text-zinc-300">
            <MathText>{s.line}</MathText>
            {s.note && (
              <span className="ml-2 text-xs text-zinc-500">— {s.note}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Precision warnings --------------------------- */

export function PrecisionFlags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      {flags.map((f, i) => (
        <li key={i}>• {f}</li>
      ))}
    </ul>
  );
}

/* ------------------------------ Working entry ----------------------------- */

export function WorkingEntry({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  async function handleImage(file: File) {
    setOcrBusy(true);
    setOcrError(null);
    try {
      type TesseractModule = {
        createWorker: (lang: string) => Promise<{
          recognize: (f: File) => Promise<{ data: { text: string } }>;
          terminate: () => Promise<void>;
        }>;
      };
      const win = window as unknown as { Tesseract?: TesseractModule };
      if (!win.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("OCR CDN unreachable"));
          document.head.appendChild(s);
        });
      }
      const worker = await win.Tesseract!.createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (lines.length === 0) {
        setOcrError("Couldn't read anything recognisable — type it instead.");
      } else {
        onChange(value ? `${value}\n${lines.join("\n")}` : lines.join("\n"));
      }
    } catch {
      setOcrError("Handwriting recognition unavailable offline — type it instead.");
    } finally {
      setOcrBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="working"
          className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
        >
          Show your working (optional — each line gets checked)
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={ocrBusy || readOnly}
          className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          title="Snap or paste a photo of your handwritten working and we'll read it"
        >
          <Camera className="h-3.5 w-3.5" />
          {ocrBusy ? "Reading…" : "From a photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <textarea
        id="working"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        rows={3}
        placeholder={"One step per line, e.g.\n3x + 6 = 12\n3x = 6\nx = 2"}
        className="mt-1.5 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-zinc-700"
      />
      {ocrError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{ocrError}</p>}
    </div>
  );
}

/* ----------------------------- Explain it back ---------------------------- */

function tokenise(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

export function ExplainBack({
  question,
  onDone,
}: {
  question: GeneratedQuestion;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<null | boolean>(null);

  function check() {
    const reference = `${question.method || ""} ${(question.steps || [])
      .map((s) => `${s.explanation} ${s.working || ""}`)
      .join(" ")}`;
    const refTokens = tokenise(reference);
    const userTokens = tokenise(text);
    if (userTokens.size < 3) {
      setVerdict(false);
      return;
    }
    let hit = 0;
    for (const t of userTokens) if (refTokens.has(t)) hit++;
    const ok = hit / userTokens.size >= 0.3;
    setVerdict(ok);
    if (ok) onDone();
  }

  return (
    <div className="mt-4 rounded-md border border-purple-300 bg-purple-50/60 p-3 dark:border-purple-800 dark:bg-purple-950/30">
      <p className="flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-200">
        <Sparkles className="h-4 w-4" /> Explain it back
      </p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        In your own words: why does this method work? Saying it out loud is what
        moves it into long-term memory.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Because…"
        className="mt-2 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-purple-600 dark:border-zinc-700"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={check}
          className="h-9 rounded-md bg-purple-700 px-3 text-sm font-semibold text-white hover:bg-purple-800"
        >
          Check my explanation
        </button>
        {verdict === true && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" /> Locked in — you understand this
            one.
          </span>
        )}
        {verdict === false && (
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Not quite — mention the key idea from the method.
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Chevron divider --------------------------- */

export function CollapseRow({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-md border border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between px-3 text-sm font-medium"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">{children}</div>}
    </div>
  );
}
