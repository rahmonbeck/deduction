import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SETTINGS = [
  "temir yo'l vagoni",
  "tog' etagidagi mehmonxona",
  "teatr sahnasi orqasi",
  "universitet laboratoriyasi",
  "restoran oshxonasi",
  "yaxta (dengiz kemasi)",
  "san'at galereyasi",
  "eski qal'a",
  "zamonaviy ofis binosi",
  "vinochilik zavodi",
  "shaxmat turniri",
  "moda ko'rgazmasi",
  "arxeologik qazish maydoni",
  "radiostansiya",
  "shirinliklar do'koni",
];

const NAME_POOLS = [
  ["Sardor", "Malika", "Bekzod", "Nilufar", "Jasur"],
  ["Farrux", "Gulnoza", "Otabek", "Sevinch", "Ravshan"],
  ["Ulug'bek", "Madina", "Sherzod", "Ziyoda", "Akmal"],
  ["Bobur", "Feruza", "Alisher", "Kamola", "Rustam"],
  ["Davron", "Nodira", "Islom", "Shahnoza", "Temur"],
];

const TWISTS = [
  "qurbon aslida o'z o'limini sahnalashtirmoqchi bo'lgan",
  "ikkita gumon qilinuvchi birgalikda til biriktirgan",
  "asosiy dalil soxta ekan",
  "jinoyatchi qurbonning yaqin qarindoshi bo'lib chiqadi",
  "voqea tasodifiy emas, oldindan uzoq vaqt rejalashtirilgan",
  "guvoh aslida yolg'on gapirgan",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

    const setting = pick(SETTINGS);
    const names = pick(NAME_POOLS);
    const twist = pick(TWISTS);

    const prompt = `Sen detektiv topishmoq (case) generatsiya qiluvchi AI'san.

ORIGINAL va noyob tergov voqeasini yarat.

VOQEA JOYI:
${setting}

ISMLAR:
Faqat shu 5 ta ismdan gumon qilinuvchilar uchun foydalan:
${names.join(", ")}

YASHIRIN TWIST:
${twist}

Muhim:
Har bir yangi case uchun voqeaga mantiqan bog'langan random guvohlar ham yarat.

Faqat quyidagi JSON formatida javob ber.
Boshqa hech qanday matn yozma.

{
  "title": "Case nomi",
  "plot_summary": "Voqea qisqacha tavsifi. 3-4 jumla. O'zbek tilida.",
  "suspects": [
    {
      "name": "Ism",
      "description": "Qisqacha tavsif",
      "alibi": "Alibisi"
    }
  ],
  "clues": [
    {
      "description": "Dalil tavsifi",
      "location": "Dalil topilgan aniq joy yoki buyum",
      "relevance": "Bu dalil nimani ko'rsatadi",
      "misleading": false
    }
  ],
  "witnesses": [
    {
      "name": "Guvohning ism-familiyasi",
      "role": "Kasbi yoki voqeaga aloqasi",
      "description": "Guvoh haqida qisqacha ma'lumot",
      "statement": "Guvoh tergov boshida aytadigan asosiy gapi",
      "personality": "Guvohning xarakteri",
      "reliability": "high yoki medium yoki low",
      "hidden_information": "Guvoh hozircha yashirayotgan muhim ma'lumot"
    }
  ],
  "culprit": ["Aybdor ismi"],
  "explanation": "Yechim va mantiqiy asoslash"
}

QAT'IY QOIDALAR:

1. Aynan 3 ta gumon qilinuvchi yarat.
2. Gumon qilinuvchilar faqat berilgan ismlar ro'yxatidan bo'lsin.
3. "culprit" HAR DOIM array bo'lsin.
4. Odatda culprit ichida faqat 1 ta ism bo'lsin.
5. Faqat twist ikkita hamkor jinoyatchini talab qilsa, culprit ichida aynan 2 ta ism bo'lsin.
6. Aynan 7 ta dalil yarat.
7. 4 ta dalil haqiqiy va "misleading": false bo'lsin.
8. 3 ta dalil red-herring va "misleading": true bo'lsin.
9. Har bir dalilda aniq "location" bo'lsin.
10. Voqea mantiqan izchil bo'lsin.
11. Aybdor aniqlanishi mumkin bo'lsin.
12. Red-herring dalillar ishonarli bo'lsin.
13. "culprit" ichidagi ism gumon qilinuvchilar orasida bo'lishi shart.
14. "culprit" ichida 2 ta ism bo'lsa, ular aynan 2 ta gumon qilinuvchi bo'lishi shart.

GUVOHLAR BO'YICHA QOIDALAR:

15. Aynan 2 dan 5 tagacha guvoh yarat.
16. Guvohlar har bir case uchun random bo'lsin.
17. Lekin har bir guvoh jinoyat, gumon qilinuvchilar yoki dalillardan kamida bittasiga mantiqan bog'langan bo'lsin.
18. Guvohlar irrelevant yoki shunchaki tasodifiy odam bo'lmasin.
19. Har bir guvohning o'ziga xos personality bo'lsin.
20. Har bir guvohning reliability qiymati faqat "high", "medium" yoki "low" bo'lsin.
21. Har bir guvoh kamida bitta muhim ma'lumotni bilsin.
22. Har bir guvoh o'zining "hidden_information" qismini boshida ochiq aytmasin.
23. hidden_information guvohning shaxsiy xotirasi, yashirayotgan siri yoki voqea haqidagi muhim kuzatuvi bo'lishi mumkin.
24. Guvohlar orasida kamida bittasi jinoyat vaqtiga oid muhim ma'lumot bilsin.
25. Guvohlar orasida kamida bittasi gumon qilinuvchilardan biri bilan bog'liq ma'lumot bilsin.
26. Guvohlarning kamida bittasi o'z bayonotida nimanidir yashirayotgan yoki noaniq aytayotgan bo'lsin.
27. Guvohlar aybdorni to'g'ridan-to'g'ri "u aybdor" deb aniq ko'rsatmasin.
28. Guvohlar orqali Sherlock Holmes mantiqiy xulosa chiqarishi mumkin bo'lsin.
29. Har bir witness name unique bo'lsin.
30. witnesses HAR DOIM array bo'lsin.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const text = response.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        {
          error: "AI javobidan JSON topilmadi",
          raw: text,
        },
        { status: 500 }
      );
    }

    const caseData = JSON.parse(jsonMatch[0]);

    const culpritArray = Array.isArray(caseData.culprit)
      ? caseData.culprit
      : [caseData.culprit];

    const witnesses = Array.isArray(caseData.witnesses)
      ? caseData.witnesses
      : [];

    const { data, error } = await supabaseAdmin
      .from("cases")
      .insert({
        fingerprint: crypto.randomUUID(),
        user_id: userId,
        title: caseData.title,
        plot_summary: caseData.plot_summary,
        solution_data: {
          suspects: caseData.suspects,
          clues: caseData.clues,
          witnesses,
          culprit: culpritArray,
          explanation: caseData.explanation,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Case insert error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      case: data,
    });
  } catch (err: any) {
    console.error("Generate case error:", err);

    return NextResponse.json(
      {
        error: err.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}