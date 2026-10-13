import { ArrowUpRight, BookMarked, FileText, PlayCircle, Sparkles } from "lucide-react";

const GROUPS = [
  {
    title: "Official past papers",
    icon: FileText,
    blurb:
      "The real thing — papers and mark schemes straight from the exam board.",
    items: [
      {
        name: "Pearson Edexcel qualifications",
        url: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels.html",
        note: "Official GCE Mathematics (9MA0) page — specs, past papers, mark schemes and grade boundaries.",
      },
      {
        name: "MadAsMaths",
        url: "https://www.madasmaths.com/",
        note: "Dr Philp's free practice papers and topic booklets with full worked solutions — kept online in his memory.",
      },
    ],
  },
  {
    title: "Question banks & worksheets",
    icon: BookMarked,
    blurb:
      "Thousands of exam-style questions, split by topic, with solutions.",
    items: [
      {
        name: "Physics & Maths Tutor",
        url: "https://www.physicsandmathstutor.com/",
        note: "Questions by topic, solution banks, and revision notes for every Edexcel A-level maths module.",
      },
      {
        name: "Dr Frost Maths",
        url: "https://www.drfrostmaths.com/",
        note: "Auto-marked worksheets, question generators and real exam questions. Free tier for students.",
      },
      {
        name: "MathsGenie",
        url: "https://www.mathsgenie.co.uk/",
        note: "Free A-level videos, worksheets and past paper walkthroughs.",
      },
      {
        name: "Save My Exams",
        url: "https://www.savemyexams.com/a-level/maths/edexcel/",
        note: "Topic questions, model answers and past papers for Edexcel A-level maths.",
      },
      {
        name: "Adamjee Maths",
        url: "https://adamjeemaths.com/",
        note: "Interactive A-level course — lessons, practice with hints and an exam-practice library.",
      },
    ],
  },
  {
    title: "Video walkthroughs & courses",
    icon: PlayCircle,
    blurb:
      "Full-spec teaching when the worked explanation is not quite enough.",
    items: [
      {
        name: "TLMaths",
        url: "https://www.tlmaths.com/",
        note: "Jack Brown's huge library of teaching videos mapped to the Edexcel spec, plus a bumper book of integrals.",
      },
      {
        name: "ExamSolutions",
        url: "https://www.examsolutions.net/",
        note: "Topic video tutorials and past practices for GCSE and A-level maths.",
      },
    ],
  },
] as const;

export default function Resources() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Practice library
        </h1>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Hand-picked, freely available resources that complement this site.
        These are external links — the material stays on the creator&apos;s own
        site and is published by them under their terms. We don&apos;t host or
        republish anyone else&apos;s papers or worksheets.
      </p>

      <div className="mt-8 grid gap-6">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {group.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {group.blurb}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/40"
                  >
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 group-hover:underline dark:text-blue-300">
                      {item.name}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.note}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
        None of these sites are affiliated with or endorsed by this tool, and
        this tool is not affiliated with or endorsed by Pearson. Links were
        checked as working at the time of writing.
      </p>
    </div>
  );
}