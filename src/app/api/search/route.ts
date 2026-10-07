import { NextRequest, NextResponse } from "next/server";
import { ChapterSearch } from "@/lib/search/chapter-search";
import { EDEXCEL_ALEVEL_CHAPTERS } from "@/data/chapters/edexcel-chapters";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const grouped = searchParams.get("grouped") === "1";

  if (grouped) {
    return NextResponse.json({
      grouped: EDEXCEL_ALEVEL_CHAPTERS,
      modules: Object.keys(EDEXCEL_ALEVEL_CHAPTERS),
    });
  }

  const searcher = new ChapterSearch();
  const results = searcher.search(q);

  return NextResponse.json({
    results,
    query: q,
    count: results.length,
  });
}
