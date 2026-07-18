import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
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
          error: "Foydalanuvchi aniqlanmadi",
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const body = await request.json();
    const caseId = body.case_id;

    if (!caseId) {
      return NextResponse.json(
        {
          error: "case_id kerak",
        },
        { status: 400 }
      );
    }

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        {
          error: "Case topilmadi",
        },
        { status: 404 }
      );
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
        },
        {
          onConflict: "id",
        }
      );

    if (userError) {
      console.error("User creation error:", userError);

      return NextResponse.json(
        {
          error: userError.message,
        },
        { status: 500 }
      );
    }

    const { data: existingSession } = await supabaseAdmin
      .from("investigation_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("case_id", caseId)
      .eq("status", "active")
      .maybeSingle();

    if (existingSession) {
      return NextResponse.json({
        success: true,
        session: existingSession,
        existing: true,
      });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("investigation_sessions")
      .insert({
        user_id: userId,
        case_id: caseId,
        status: "active",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);

      return NextResponse.json(
        {
          error: sessionError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      existing: false,
    });
  } catch (err: any) {
    console.error("Unexpected session error:", err);

    return NextResponse.json(
      {
        error: err.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}
