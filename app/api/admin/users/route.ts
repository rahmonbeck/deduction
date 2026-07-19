import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "rahmonjon303@icloud.com";

async function getAdminUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.replace("Bearer ", "");

  const { data, error } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  const email = data.user.email?.toLowerCase();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return data.user;
}

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminUser(request);

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "Ruxsat berilmagan",
        },
        { status: 403 }
      );
    }

    const users: any[] = [];

    let page = 1;

    const perPage = 1000;

    while (true) {
      const { data, error } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        throw error;
      }

      users.push(...data.users);

      if (data.users.length < perPage) {
        break;
      }

      page++;
    }

    const { data: cases, error: casesError } =
      await supabaseAdmin
        .from("cases")
        .select("user_id");

    if (casesError) {
      throw casesError;
    }

    const caseCountMap: Record<string, number> = {};

    for (const item of cases ?? []) {
      if (!item.user_id) continue;

      caseCountMap[item.user_id] =
        (caseCountMap[item.user_id] || 0) + 1;
    }

    const result = users
      .map((user) => ({
        id: user.id,
        email: user.email ?? "Email yo'q",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        case_count: caseCountMap[user.id] || 0,
      }))
      .sort((a, b) => {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });

    return NextResponse.json({
      success: true,
      users: result,
    });
  } catch (error: any) {
    console.error("Admin users API error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Foydalanuvchilarni yuklashda xato",
      },
      { status: 500 }
    );
  }
}