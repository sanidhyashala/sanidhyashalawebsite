import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { articleSlug } = await request.json();

    const { data: existingReaction, error: findError } =
      await supabaseServer
        .from("reactions")
        .select("id")
        .eq("article_slug", articleSlug)
        .eq("user_id", userId)
        .maybeSingle();

    if (findError) {
      console.error("FIND ERROR:", findError);

      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    if (existingReaction) {
      const { error: deleteError } =
        await supabaseServer
          .from("reactions")
          .delete()
          .eq("id", existingReaction.id);

      if (deleteError) {
        console.error("DELETE ERROR:", deleteError);

        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        reacted: false,
      });
    }

    const { data, error: insertError } =
      await supabaseServer
        .from("reactions")
        .insert({
          article_slug: articleSlug,
          user_id: userId,
        })
        .select();

    console.error("INSERT DATA:", data);
    console.error("INSERT ERROR:", insertError);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reacted: true,
    });
  } catch (error) {
    console.error("ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}