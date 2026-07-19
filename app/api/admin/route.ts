import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "rahmonjon303@icloud.com";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          isAdmin: false,
          error: "Authorization token topilmadi",
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          isAdmin: false,
          error: "Foydalanuvchi aniqlanmadi",
        },
        { status: 401 }
      );
    }

    const userEmail = authData.user.email?.toLowerCase();

    const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

    return NextResponse.json({
      isAdmin,
      email: userEmail,
    });
  } catch (err: any) {
    console.error("Admin check error:", err);

    return NextResponse.json(
      {
        isAdmin: false,
        error: err?.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}