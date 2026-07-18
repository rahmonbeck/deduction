import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Case ID topilmadi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cases")
      .select(
        "id, fingerprint, title, plot_summary, solution_data, created_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Case detail error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: data,
    });
  } catch (err: any) {
    console.error("Unexpected case detail error:", err);

    return NextResponse.json(
      {
        error: err.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}
