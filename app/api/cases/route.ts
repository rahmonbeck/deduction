import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "rahmonjon303@icloud.com";

async function getUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.slice(7);

  const { data, error } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function GET(request: Request) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Sessiya topilmadi",
        },
        {
          status: 401,
        }
      );
    }

    const isAdmin =
      user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase();

    let query = supabaseAdmin
      .from("cases")
      .select(
        "id, fingerprint, title, plot_summary, created_at, user_id"
      )
      .order("created_at", {
        ascending: false,
      });

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Cases fetch error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      cases: data ?? [],
    });
  } catch (error: any) {
    console.error("Cases API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Tergov ishlarini yuklashda xato",
      },
      {
        status: 500,
      }
    );
  }
}