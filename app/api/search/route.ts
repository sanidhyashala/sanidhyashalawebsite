import { NextRequest, NextResponse } from "next/server";

import {
  SearchRegistry,
  searchResources,
} from "@/lib/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const results = searchResources(query, SearchRegistry);

  return NextResponse.json({
    success: true,
    query,
    total: results.length,
    results,
  });
}