import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("case_metadata")
      .select("id, fingerprint, title, plot_summary, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Cases fetch error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cases: data ?? [],
    });
  } catch (error) {
    console.error("Cases API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Case'larni yuklashda server xatosi",
      },
      { status: 500 }
    );
  }
}
