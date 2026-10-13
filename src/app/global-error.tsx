"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void reset;
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-black text-zinc-300">Error</p>
        <h1 className="mt-4 text-xl font-bold">A fatal error occurred</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Something went very wrong. Reload to carry on — your progress is
          already saved.
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}