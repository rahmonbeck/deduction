import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token topilmadi" }, { status: 401 });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Foydalanuvchi aniqlanmadi" }, { status: 401 });
    }

    const userId = authData.user.id;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Case ID topilmadi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("cases")
      .select("id, fingerprint, title, plot_summary, solution_data, created_at, user_id")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Case detail error:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (data.user_id !== userId) {
      return NextResponse.json({ error: "Bu faylga kirish huquqingiz yo'q" }, { status: 403 });
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
