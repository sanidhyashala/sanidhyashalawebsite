import { NextRequest, NextResponse } from "next/server";

import {
  SearchRegistry,
  searchResources,
} from "@/lib/search";

const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
    const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

    if (query.length === 0) {
      return NextResponse.json({
        success: true,
        query: "",
        total: 0,
        results: [],
      });
    }

    const results = searchResources(query, SearchRegistry);

    return NextResponse.json({
      success: true,
      query,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error("Search API error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}