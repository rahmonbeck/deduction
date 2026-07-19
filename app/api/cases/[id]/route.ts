import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "rahmonjon303@icloud.com";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
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

    if (authData.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Case ID topilmadi" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("cases").delete().eq("id", id);

    if (error) {
      console.error("Case delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected admin delete error:", err);
    return NextResponse.json(
      {
        error: err.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}
