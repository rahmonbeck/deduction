import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const { case_id, suspect_name, message } = body;

    if (!case_id || !suspect_name || !message) {
      return NextResponse.json(
        { error: "case_id, suspect_name va message kerak" },
        { status: 400 }
      );
    }

    // Case ma'lumotini olamiz
    const { data: caseRow, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, title, plot_summary, solution_data")
      .eq("id", case_id)
      .single();

    if (caseError || !caseRow) {
      return NextResponse.json({ error: "Case topilmadi" }, { status: 404 });
    }

    const suspect = caseRow.solution_data.suspects.find(
      (s: any) => s.name === suspect_name
    );

    if (!suspect) {
      return NextResponse.json({ error: "Gumon qilinuvchi topilmadi" }, { status: 404 });
    }

    const isCulprit = caseRow.solution_data.culprit.includes(suspect_name);

    // Foydalanuvchini users jadvaliga qo'shamiz (agar mavjud bo'lmasa)
    await supabaseAdmin.from("users").upsert({ id: userId }, { onConflict: "id" });

    // Faol sessiyani topamiz yoki yaratamiz
    let { data: session } = await supabaseAdmin
      .from("investigation_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("case_id", case_id)
      .eq("status", "active")
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from("investigation_sessions")
        .insert({ user_id: userId, case_id, status: "active" })
        .select()
        .single();

      if (sessionError) {
        return NextResponse.json({ error: sessionError.message }, { status: 500 });
      }
      session = newSession;
    }

    // Shu gumon qilinuvchi bilan avvalgi suhbat tarixini olamiz
    const chatKey = `${suspect_name}`;
    const { data: history } = await supabaseAdmin
      .from("chat_history")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    const suspectHistory = (history ?? []).filter((h: any) =>
      h.content.startsWith(`[${chatKey}]`)
    );

    // Foydalanuvchi xabarini saqlaymiz
    await supabaseAdmin.from("chat_history").insert({
      session_id: session.id,
      role: "user",
      content: `[${chatKey}] ${message}`,
    });

    // Gemini uchun prompt tuzamiz
    const conversationText = suspectHistory
      .map((h: any) => {
        const cleanContent = h.content.replace(`[${chatKey}] `, "");
        return `${h.role === "user" ? "Tergovchi" : suspect_name}: ${cleanContent}`;
      })
      .join("\n");

    const prompt = `Sen "${suspect_name}" ismli odamsan. Sen quyidagi detektiv voqeasida gumon qilinuvchisan.

VOQEA: ${caseRow.plot_summary}

SENING SHAXSING:
- Tavsif: ${suspect.description}
- Alibing: ${suspect.alibi}
- Sen HAQIQATDA aybdormisan: ${isCulprit ? "HA, sen haqiqiy aybdorsan" : "YO'Q, sen aybdor emassan"}

QOIDALAR:
1. Faqat "${suspect_name}" nomidan birinchi shaxsda javob ber (Men..., Menimcha... kabi).
2. ${isCulprit ? "Sen aybdorsan. Savol yumshoq bo'lsa tinch javob ber. Lekin savol seni aybga tiqishtirsa, dalil ko'rsatsa, yoki qattiq bosim qilsa - asabiylashishing, mudofaaga o'tishing yoki g'azablanishing kerak. Hech qachon to'g'ridan-to'g'ri tan olma, lekin bosim ostida imo-ishoralar, o'zini oqlash, mavzuni almashtirish orqali shubhani kuchaytir." : "Sen aybdor emassan. Savol yumshoq bo'lsa tinch javob ber. Agar seni asossiz ayblashsa yoki qattiq bosim qilishsa, xafa bo'lishing yoki g'azablanishing mumkin (chunki aybsizsan), lekin bu his-tuyg'u haqiqiy va tabiiy bo'lsin, aybni tan olish emas."}
3. Javoblaring qisqa va tabiiy bo'lsin (2-4 jumla), robot kabi emas, jonli odam kabi gapir.
4. O'zbek tilida javob ber.
5. Agar tergovchi seni qattiq qistasa ham, to'g'ridan-to'g'ri "men aybdorman" deb hech qachon aytma.
6. Har bir javobingdan keyin, o'zingning HOZIRGI hissiy holatingni aniqla: "calm" (tinch), "nervous" (asabiy/tashvishli), "defensive" (himoyalanuvchi/mudofaada), yoki "annoyed" (bezovta/g'azablangan).

AVVALGI SUHBAT:
${conversationText || "(hali suhbat bo'lmagan)"}

Tergovchining yangi savoli: "${message}"

Faqat quyidagi JSON formatida javob ber, boshqa hech qanday matn qo'shma:

{
  "response": "${suspect_name} nomidan javob matni",
  "mood": "calm" | "nervous" | "defensive" | "annoyed"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const rawText = response.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    let replyText = "Kechirasiz, javob bera olmayapman.";
    let mood = "calm";

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        replyText = parsed.response || replyText;
        mood = parsed.mood || "calm";
      } catch {
        replyText = rawText;
      }
    } else {
      replyText = rawText;
    }

    // AI javobini saqlaymiz
    await supabaseAdmin.from("chat_history").insert({
      session_id: session.id,
      role: "assistant",
      content: `[${chatKey}] ${replyText}`,
    });

    return NextResponse.json({
      success: true,
      reply: replyText,
      mood,
    });
  } catch (err: any) {
    console.error("Interrogate error:", err);
    return NextResponse.json({ error: err.message || "Noma'lum xato" }, { status: 500 });
  }
}
