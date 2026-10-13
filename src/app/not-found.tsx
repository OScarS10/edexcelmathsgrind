import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-zinc-300 dark:text-zinc-700">
        404
      </p>
      <h1 className="mt-4 text-xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        That page does not exist. Try the practice area or browse chapters
        instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/practice"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Practice
        </Link>
        <Link
          href="/search"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Browse chapters
        </Link>
      </div>
    </div>
  );
}