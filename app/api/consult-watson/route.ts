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
    const { case_id, message } = body;

    if (!case_id || !message) {
      return NextResponse.json({ error: "case_id va message kerak" }, { status: 400 });
    }

    const { data: caseRow, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, title, plot_summary, solution_data")
      .eq("id", case_id)
      .single();

    if (caseError || !caseRow) {
      return NextResponse.json({ error: "Case topilmadi" }, { status: 404 });
    }

    await supabaseAdmin.from("users").upsert({ id: userId }, { onConflict: "id" });

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

    const chatKey = "WATSON";
    const { data: history } = await supabaseAdmin
      .from("chat_history")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    const watsonHistory = (history ?? []).filter((h: any) =>
      h.content.startsWith(`[${chatKey}]`)
    );

    await supabaseAdmin.from("chat_history").insert({
      session_id: session.id,
      role: "user",
      content: `[${chatKey}] ${message}`,
    });

    const conversationText = watsonHistory
      .map((h: any) => {
        const cleanContent = h.content.replace(`[${chatKey}] `, "");
        return `${h.role === "user" ? "Sherlock Holmes" : "Doktor Watson"}: ${cleanContent}`;
      })
      .join("\n");

    // Watson uchun to'liq case ma'lumotini (dalillar, gumon qilinuvchilar) beramiz - lekin
    // to'g'ridan-to'g'ri aybdorni aytmasligini so'raymiz
    const suspectsList = caseRow.solution_data.suspects
      .map((s: any) => `- ${s.name}: ${s.description}. Alibi: ${s.alibi}`)
      .join("\n");

    const cluesList = caseRow.solution_data.clues
      .map((c: any) => `- ${c.location}: ${c.description} (${c.relevance})`)
      .join("\n");

    const prompt = `Sen Doktor Vatsonsan (Doctor Watson) - Sherlock Holmesning sodiq do'sti va yordamchisi.

Sen hozir Sherlock Holmes bilan birga quyidagi tergov ishini olib boryapsan:

VOQEA: ${caseRow.plot_summary}

GUMON QILINUVCHILAR:
${suspectsList}

MA'LUM DALILLAR:
${cluesList}

QOIDALAR:
1. Sen Sherlock Holmesning yordamchisisan, lekin undan unchalik zukko emassan - fikrlaringni ovoz chiqarib aytasan, gipoteza qurasan, lekin ba'zan xato ham qilishing mumkin.
2. Foydalanuvchini har doim "Holmes" yoki "Do'stim Holmes" deb chaqir - u Sherlock Holmes.
3. HECH QACHON to'g'ridan-to'g'ri "aybdor - bu ..." deb ayblama. Buning o'rniga, dalillarni tahlil qilishda yordam ber, savol ber, taxminlar qil, lekin yakuniy xulosani Holmesning o'ziga qoldir.
4. Javoblaring qisqa va tabiiy bo'lsin (2-4 jumla), do'stona va hurmatli ohangda.
5. O'zbek tilida javob ber.
6. Agar Holmes sendan to'g'ridan-to'g'ri "kim aybdor" deb so'rasa, hazil bilan yoki tavozе bilan rad et: masalan "Bu xulosani faqat siz chiqarishingiz kerak, Holmes - men shunchaki kuzataman" kabi.

AVVALGI SUHBAT:
${conversationText || "(hali suhbat bo'lmagan)"}

Holmesning yangi xabari: "${message}"

Faqat Doktor Vatson nomidan javobni yoz, boshqa hech narsa qo'shma.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const replyText = response.text ?? "Kechirasiz, Holmes, hozir fikrimni yig'olmayapman.";

    await supabaseAdmin.from("chat_history").insert({
      session_id: session.id,
      role: "assistant",
      content: `[${chatKey}] ${replyText}`,
    });

    return NextResponse.json({
      success: true,
      reply: replyText,
    });
  } catch (err: any) {
    console.error("Watson consult error:", err);
    return NextResponse.json({ error: err.message || "Noma'lum xato" }, { status: 500 });
  }
}
