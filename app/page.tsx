"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

type Suspect = {
  name: string;
  description: string;
  alibi: string;
};

type Clue = {
  description: string;
  location: string;
  relevance: string;
  misleading: boolean;
};

type CaseData = {
  id: string;
  title: string;
  plot_summary: string;
  solution_data: {
    suspects: Suspect[];
    clues: Clue[];
    culprit: string[];
    explanation: string;
  };
};

type CaseMetadata = {
  id: string;
  fingerprint: string;
  title: string;
  plot_summary: string;
  created_at: string;
};

type Section = "cover" | "details" | "suspects" | "clues" | "verdict";

type View = "home" | "archive" | "case";

type ClueDecision = "kept" | "dismissed" | null;

function arraysEqualAsSets(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

function moodBadge(mood?: string) {
  switch (mood) {
    case "nervous":
      return { emoji: "😰", label: "ASABIY", color: "#c9a227" };
    case "defensive":
      return { emoji: "🛡️", label: "MUDOFAADA", color: "#c97a27" };
    case "annoyed":
      return { emoji: "😠", label: "BEZOVTA", color: "#c9432a" };
    case "calm":
    default:
      return { emoji: "😐", label: "TINCH", color: "#5fae74" };
  }
}

function ClueIcon({ index }: { index: number }) {
  const type = index % 7;

  return (
    <svg width="36" height="36" viewBox="0 0 110 110" className="flex-shrink-0">
      <rect width="110" height="110" rx="4" fill="#1c1a17" />

      {type === 0 && (
        <>
          <rect x="35" y="28" width="40" height="52" rx="2" fill="#e4d9c4" />
          <line x1="42" y1="40" x2="68" y2="40" stroke="#1c1a17" strokeWidth="2" />
          <line x1="42" y1="50" x2="68" y2="50" stroke="#1c1a17" strokeWidth="2" />
          <line x1="42" y1="60" x2="60" y2="60" stroke="#1c1a17" strokeWidth="2" />
        </>
      )}

      {type === 1 && (
        <>
          <circle cx="45" cy="45" r="18" fill="none" stroke="#e4d9c4" strokeWidth="4" />
          <line
            x1="58"
            y1="58"
            x2="75"
            y2="75"
            stroke="#e4d9c4"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}

      {type === 2 && (
        <>
          <path
            d="M55 25 Q70 30 70 45 Q70 60 55 80 Q40 60 40 45 Q40 30 55 25Z"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="2"
          />
          <path
            d="M47 35 Q55 38 63 35"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="1.5"
          />
          <path
            d="M45 45 Q55 49 65 45"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="1.5"
          />
          <path
            d="M47 55 Q55 58 63 55"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="1.5"
          />
        </>
      )}

      {type === 3 && (
        <>
          <circle
            cx="42"
            cy="42"
            r="12"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="4"
          />
          <line
            x1="51"
            y1="51"
            x2="77"
            y2="77"
            stroke="#e4d9c4"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="67"
            y1="67"
            x2="75"
            y2="59"
            stroke="#e4d9c4"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="72"
            y1="72"
            x2="80"
            y2="64"
            stroke="#e4d9c4"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}

      {type === 4 && (
        <>
          <path
            d="M32 35 Q55 20 78 35 L72 76 Q55 88 38 76 Z"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="3"
          />
          <path
            d="M40 42 Q55 48 70 42"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="2"
          />
          <path
            d="M40 55 Q55 61 70 55"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="2"
          />
        </>
      )}

      {type === 5 && (
        <>
          <path
            d="M38 75 Q28 58 35 45 Q40 36 47 45 L50 55 L50 31 Q50 25 55 25 Q60 25 60 31 V51 L62 30 Q63 25 68 26 Q72 27 71 33 L69 54 L73 38 Q75 33 79 35 Q83 37 81 43 L76 65 Q72 80 60 83 Z"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="3"
          />
        </>
      )}

      {type === 6 && (
        <>
          <path
            d="M30 70 L55 30 L80 70 Z"
            fill="none"
            stroke="#e4d9c4"
            strokeWidth="3"
          />
          <circle cx="55" cy="60" r="5" fill="#e4d9c4" />
          <line
            x1="55"
            y1="42"
            x2="55"
            y2="54"
            stroke="#e4d9c4"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}

function SectionHeader({
  number,
  title,
  onBack,
}: {
  number: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="border-b border-[#b9a98f] pb-6">
      <button
        onClick={onBack}
        className="mb-8 text-xs text-[#766858] transition hover:text-[#29221b]"
      >
        ← MUNDARIJAGA QAYTISH
      </button>

      <div className="flex items-end justify-between">
        <div>
          <div className="typewriter text-xs text-[#766858]">
            SAHIFA {number}
          </div>

          <h2 className="typewriter mt-3 text-3xl font-bold tracking-widest">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [view, setView] = useState<View>("home");
  const [section, setSection] = useState<Section>("cover");

  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cases, setCases] = useState<CaseMetadata[]>([]);
  const [caseData, setCaseData] = useState<CaseData | null>(null);

  const [selectedSuspects, setSelectedSuspects] = useState<Set<string>>(
    new Set()
  );

  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);

  const [revealedClues, setRevealedClues] = useState<Set<number>>(new Set());

  const [clueDecisions, setClueDecisions] = useState<
    Record<number, ClueDecision>
  >({});

  const [pageTurning, setPageTurning] = useState(false);

  const [chatSuspect, setChatSuspect] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string; mood?: string }[]
  >([]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [watsonOpen, setWatsonOpen] = useState(false);
  const [watsonMessages, setWatsonMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [watsonInput, setWatsonInput] = useState("");
  const [watsonLoading, setWatsonLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function getToken() {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token;
  }

  async function checkAuth() {
    const { data } = await supabaseBrowser.auth.getSession();

    if (!data.session) {
      router.push("/login");
      return;
    }

    const email = data.session.user.email ?? null;

    setUserEmail(email);

    try {
      const res = await fetch("/api/admin", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      const json = await res.json();

      setIsAdmin(json.isAdmin === true);
    } catch {
      setIsAdmin(false);
    }

    setCheckingAuth(false);
  }

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  }

  async function loadCases() {
    try {
      setLoadingCases(true);
      setError(null);

      const token = await getToken();

      const res = await fetch("/api/cases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Arxivni yuklashda xato");
      }

      setCases(json.cases ?? []);
    } catch (err: any) {
      setError(err.message || "Arxivni yuklashda xato");
    } finally {
      setLoadingCases(false);
    }
  }

  function openArchive() {
    setError(null);
    setView("archive");
    loadCases();
  }

  async function openCase(id: string) {
    setError(null);
    setLoading(true);

    try {
      const token = await getToken();

      const res = await fetch(`/api/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Faylni ochishda xato");
      }

      setCaseData(json.case);
      setSelectedSuspects(new Set());
      setVerdict(null);
      setRevealedClues(new Set());
      setClueDecisions({});
      setSection("cover");
      setView("case");
      setPageTurning(true);

      setTimeout(() => {
        setPageTurning(false);
      }, 1100);
    } catch (err: any) {
      setError(err.message || "Faylni ochishda xato");
    } finally {
      setLoading(false);
    }
  }

  async function generateCase() {
    setError(null);
    setLoading(true);

    try {
      const token = await getToken();

      const res = await fetch("/api/generate-case", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Fayl yaratishda xato");
      }

      setCaseData(json.case);
      setSelectedSuspects(new Set());
      setVerdict(null);
      setRevealedClues(new Set());
      setClueDecisions({});
      setSection("cover");
      setView("case");
      setPageTurning(true);

      setTimeout(() => {
        setPageTurning(false);
      }, 1100);
    } catch (err: any) {
      setError(err.message || "Fayl yaratishda xato");
    } finally {
      setLoading(false);
    }
  }

  function closeCase() {
    setPageTurning(true);

    setTimeout(() => {
      setView("home");
      setCaseData(null);
      setPageTurning(false);
    }, 1100);
  }

  function goToSection(nextSection: Section) {
    if (section === nextSection) return;

    setPageTurning(true);

    setTimeout(() => {
      setSection(nextSection);
    }, 550);

    setTimeout(() => {
      setPageTurning(false);
    }, 1100);
  }

  function toggleSuspect(name: string) {
    if (verdict) return;

    setSelectedSuspects((prev) => {
      const next = new Set(prev);

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });
  }

  function toggleClue(i: number) {
    setRevealedClues((prev) => {
      const next = new Set(prev);

      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }

      return next;
    });
  }

  function decideClue(i: number, decision: ClueDecision) {
    setClueDecisions((prev) => ({
      ...prev,
      [i]: decision,
    }));
  }

  function confirmVerdict() {
    if (!caseData || selectedSuspects.size === 0) return;

    const chosen = Array.from(selectedSuspects);

    const isCorrect = arraysEqualAsSets(
      chosen,
      caseData.solution_data.culprit
    );

    setVerdict(isCorrect ? "correct" : "wrong");
    setSection("verdict");
  }

  function openChat(suspectName: string) {
    setChatSuspect(suspectName);
    setChatMessages([]);
    setChatInput("");
  }

  function closeChat() {
    setChatSuspect(null);
    setChatMessages([]);
    setChatInput("");
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !caseData || !chatSuspect || chatLoading) {
      return;
    }

    const userMessage = chatInput.trim();

    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const token = await getToken();

      const res = await fetch("/api/interrogate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          case_id: caseData.id,
          suspect_name: chatSuspect,
          message: userMessage,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "So'roq qilishda xato");
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.reply,
          mood: json.mood,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `(Xato: ${err.message || "Noma'lum xato"})`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function openWatson() {
    setWatsonOpen(true);
    setWatsonMessages([]);
    setWatsonInput("");
  }

  function closeWatson() {
    setWatsonOpen(false);
    setWatsonMessages([]);
    setWatsonInput("");
  }

  async function sendWatsonMessage() {
    if (!watsonInput.trim() || !caseData || watsonLoading) return;

    const userMessage = watsonInput.trim();
    setWatsonMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setWatsonInput("");
    setWatsonLoading(true);

    try {
      const token = await getToken();

      const res = await fetch("/api/consult-watson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          case_id: caseData.id,
          message: userMessage,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Watson bilan bog'lanishda xato");
      }

      setWatsonMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } catch (err: any) {
      setWatsonMessages((prev) => [
        ...prev,
        { role: "assistant", content: `(Xato: ${err.message || "Noma'lum xato"})` },
      ]);
    } finally {
      setWatsonLoading(false);
    }
  }

  const caseNumber = caseData
    ? caseData.id.slice(0, 4).toUpperCase()
    : "0000";

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100d0a] text-[#d8cdbb]">
        <div
          className="text-xs tracking-widest"
          style={{ fontFamily: "monospace" }}
        >
          TEKSHIRILMOQDA...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#100d0a] text-[#d8cdbb]">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #100d0a;
        }

        .detective-bg {
          background:
            radial-gradient(
              ellipse at 50% 0%,
              rgba(120, 77, 38, 0.18),
              transparent 55%
            ),
            radial-gradient(
              ellipse at 50% 100%,
              rgba(0, 0, 0, 0.8),
              transparent 70%
            ),
            #100d0a;
        }

        .typewriter {
          font-family: monospace;
          letter-spacing: 0.08em;
        }

        .home-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #68482d;
          background: #24150d;
          transition:
            transform 0.35s ease,
            filter 0.35s ease,
            border-color 0.35s ease;
        }

        .home-card:hover {
          transform: translateY(-10px);
          filter: brightness(1.15);
          border-color: #a67a4c;
        }

        .home-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05),
            transparent 35%,
            rgba(0, 0, 0, 0.25)
          );
        }

        .home-card-red {
          background: #64221e;
          border-color: #8d302b;
        }

        .home-card-red:hover {
          border-color: #c05a50;
        }

        .archive-shelf {
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025),
              transparent 5%,
              transparent 95%,
              rgba(0, 0, 0, 0.4)
            ),
            linear-gradient(180deg, #352218, #1a100b 60%, #0d0906);
          box-shadow:
            inset 0 0 50px rgba(0, 0, 0, 0.8),
            0 30px 100px rgba(0, 0, 0, 0.8);
        }

        .shelf-line {
          background: linear-gradient(90deg, #24150d, #8b5c32, #24150d);
          box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.8),
            inset 0 1px rgba(255, 255, 255, 0.1);
        }

        .file-folder {
          transition:
            transform 0.3s ease,
            filter 0.3s ease;
          box-shadow:
            inset 0 0 15px rgba(0, 0, 0, 0.35),
            5px 8px 10px rgba(0, 0, 0, 0.45);
        }

        .file-folder:hover {
          transform: translateY(-12px) rotate(-1deg);
          filter: brightness(1.2);
        }

        .page {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          perspective: 1800px;
          background:
            linear-gradient(
              90deg,
              rgba(120, 95, 65, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              rgba(120, 95, 65, 0.04) 1px,
              transparent 1px
            ),
            #eee5d3;
          background-size: 24px 24px;
          color: #29221b;
          box-shadow:
            0 25px 70px rgba(0, 0, 0, 0.7),
            inset 0 0 45px rgba(105, 75, 35, 0.06);
        }

        .page-turn::before {
          content: "";
          position: absolute;
          z-index: 50;
          inset: 0;
          pointer-events: none;
          transform-origin: left center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          background:
            linear-gradient(
              90deg,
              rgba(95, 68, 40, 0.22),
              transparent 7%,
              transparent 85%,
              rgba(80, 55, 30, 0.08)
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.14),
              transparent 20%,
              rgba(80, 50, 25, 0.04)
            ),
            #eee5d3;
          box-shadow:
            12px 0 22px rgba(0, 0, 0, 0.2),
            inset -12px 0 20px rgba(65, 45, 25, 0.12);
          animation: realPaperTurn 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)
            forwards;
        }

        .page-turn::after {
          content: "";
          position: absolute;
          z-index: 49;
          top: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            rgba(38, 25, 14, 0.45),
            rgba(38, 25, 14, 0.14) 8%,
            transparent 22%
          );
          transform-origin: left center;
          animation: pageFoldShadow 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)
            forwards;
        }

        @keyframes realPaperTurn {
          0% {
            transform: rotateY(0deg);
            filter: brightness(0.8);
          }

          18% {
            transform: rotateY(-18deg);
            filter: brightness(0.86);
          }

          38% {
            transform: rotateY(-48deg);
            filter: brightness(0.92);
          }

          55% {
            transform: rotateY(-86deg);
            filter: brightness(0.98);
          }

          72% {
            transform: rotateY(-128deg);
            filter: brightness(1);
          }

          88% {
            transform: rotateY(-165deg);
            filter: brightness(1);
          }

          100% {
            transform: rotateY(-180deg);
            filter: brightness(1);
          }
        }

        @keyframes pageFoldShadow {
          0% {
            opacity: 0.8;
            transform: rotateY(0deg);
          }

          30% {
            opacity: 0.65;
            transform: rotateY(-40deg);
          }

          60% {
            opacity: 0.3;
            transform: rotateY(-100deg);
          }

          100% {
            opacity: 0;
            transform: rotateY(-180deg);
          }
        }

        .stamp {
          transform: rotate(-6deg);
          border: 3px solid #9c2924;
          color: #9c2924;
        }

        .paper-line {
          border-bottom: 1px solid rgba(50, 40, 30, 0.2);
        }
      `}</style>

      <div className="detective-bg min-h-screen">
        {view === "home" && (
          <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
            <div className="mb-6 flex items-center justify-between text-xs text-[#665443]">
              <div className="typewriter">{userEmail}</div>

              <div className="flex items-center gap-6">
                {isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="typewriter text-[#c9a227] transition hover:text-[#f0d56a]"
                  >
                    ADMIN PANEL →
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="typewriter transition hover:text-[#d8cdbb]"
                >
                  CHIQISH →
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <header className="mb-16 text-center">
                <div className="typewriter mb-4 text-xs tracking-[0.45em] text-[#8d7861]">
                  TERGOV BOSHQARMASI
                </div>

                <h1 className="typewriter text-6xl font-bold tracking-[0.25em] text-[#d8cdbb]">
                  DEDUCTION
                </h1>

                <p className="mt-5 text-sm italic text-[#806e5b]">
                  Tergov ishlarini boshlang
                </p>
              </header>

              {error && (
                <div className="mx-auto mb-8 max-w-xl border border-[#8d302b] bg-[#291614] p-4 text-center text-sm text-[#d9958b]">
                  XATO: {error}
                </div>
              )}

              <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2">
                <button
                  onClick={generateCase}
                  disabled={loading}
                  className="home-card home-card-red min-h-[330px] p-10 text-left disabled:opacity-40"
                >
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <div className="typewriter mb-10 text-xs tracking-[0.3em] text-[#d6b58b]">
                        YANGI ISH
                      </div>

                      <h2 className="typewriter text-3xl font-bold tracking-wider text-[#f0dfc8]">
                        YANGI TERGOV
                      </h2>

                      <p className="mt-5 max-w-sm text-base leading-relaxed text-[#d6b58b]">
                        Yangi jinoyat ishini oching va tergovni boshlang.
                      </p>
                    </div>

                    <div className="typewriter text-xs tracking-widest text-[#e7d7c1]">
                      {loading ? "TAYYORLANMOQDA..." : "ISHNI BOSHLASH →"}
                    </div>
                  </div>
                </button>

                <button
                  onClick={openArchive}
                  className="home-card min-h-[330px] p-10 text-left"
                >
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <div className="typewriter mb-10 text-xs tracking-[0.3em] text-[#aa8b6b]">
                        ARXIV
                      </div>

                      <h2 className="typewriter text-3xl font-bold tracking-wider text-[#e5d4ba]">
                        TERGOV ARXIVI
                      </h2>

                      <p className="mt-5 max-w-sm text-base leading-relaxed text-[#c5a781]">
                        Avvalgi tergov fayllarini ko'rib chiqing.
                      </p>
                    </div>

                    <div className="typewriter text-xs tracking-widest text-[#d6b58b]">
                      ARXIVNI OCHISH →
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-10 text-center">
              <div className="typewriter text-[10px] tracking-[0.35em] text-[#4d3b2b]">
                DEDUCTION · INVESTIGATION SYSTEM
              </div>
            </div>
          </section>
        )}

        {view === "archive" && (
          <section className="mx-auto min-h-screen max-w-6xl px-6 py-12">
            <div className="mb-8 flex items-center justify-between">
              <button
                onClick={() => setView("home")}
                className="typewriter text-xs tracking-widest text-[#8d7861] transition hover:text-[#d8cdbb]"
              >
                ← BOSH SAHIFA
              </button>

              <div className="typewriter text-xs text-[#665443]">
                {loadingCases
                  ? "TEKSHIRILMOQDA..."
                  : `${cases.length} TA FAYL`}
              </div>
            </div>

            <header className="mb-14 text-center">
              <div className="typewriter mb-3 text-xs tracking-[0.45em] text-[#8d7861]">
                TERGOV BOSHQARMASI · DALILLAR ARXIVI
              </div>

              <h1 className="typewriter text-5xl font-bold tracking-[0.25em] text-[#d8cdbb]">
                ARXIV
              </h1>

              <p className="mt-4 text-sm italic text-[#806e5b]">
                Tergov ishlari arxivi
              </p>
            </header>

            {error && (
              <div className="mx-auto mb-8 max-w-xl border border-[#8d302b] bg-[#291614] p-4 text-center text-sm text-[#d9958b]">
                XATO: {error}
              </div>
            )}

            <div className="mx-auto max-w-5xl">
              <div className="archive-shelf rounded-sm border border-[#513521] p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div className="typewriter text-xs tracking-[0.35em] text-[#aa8b6b]">
                    TERGOV ARXIVI
                  </div>

                  <div className="typewriter text-xs text-[#665443]">
                    {loadingCases
                      ? "TEKSHIRILMOQDA..."
                      : `${cases.length} TA FAYL`}
                  </div>
                </div>

                {cases.length === 0 && !loadingCases ? (
                  <div className="py-20 text-center">
                    <div className="mb-4 text-6xl opacity-30">🗃️</div>

                    <p className="typewriter text-sm text-[#8d7861]">
                      ARXIV BO'SH
                    </p>

                    <p className="mt-2 text-xs text-[#665443]">
                      Birinchi tergov faylini yarating
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {cases.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => openCase(item.id)}
                        className="file-folder relative min-h-[230px] overflow-hidden rounded-sm border border-[#68482d] bg-[#68482d] p-5 text-left"
                        style={{
                          transform: `rotate(${
                            index % 2 === 0 ? "-1deg" : "1deg"
                          })`,
                        }}
                      >
                        <div className="absolute right-3 top-3 text-[10px] text-[#d6b58b]">
                          {index % 3 === 0 ? "MAXFIY" : "FAYL"}
                        </div>

                        <div className="mt-8 border-b border-[#a67a4c] pb-4">
                          <div className="typewriter text-xs text-[#d6b58b]">
                            FAYL №{String(index + 1).padStart(3, "0")}
                          </div>

                          <div className="mt-4 line-clamp-3 text-lg font-bold text-[#e5d4ba]">
                            {item.title}
                          </div>
                        </div>

                        <div className="mt-5 text-xs text-[#c5a781]">
                          {new Date(item.created_at).toLocaleDateString(
                            "uz-UZ"
                          )}
                        </div>

                        <div className="absolute bottom-4 right-5 text-xs text-[#d6b58b]">
                          OCHISH →
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="shelf-line mt-10 h-4 rounded-sm" />
              </div>
            </div>
          </section>
        )}

        {view === "case" && (
          <section className="mx-auto min-h-screen max-w-5xl px-6 py-10">
            <div className="mb-8 flex items-center justify-between">
              <button
                onClick={closeCase}
                className="typewriter text-xs tracking-widest text-[#8d7861] transition hover:text-[#d8cdbb]"
              >
                ← BOSH SAHIFAGA QAYTISH
              </button>

              <div className="typewriter text-xs text-[#665443]">
                FAYL #{caseNumber}
              </div>
            </div>

            <div
              className={`page mx-auto min-h-[720px] max-w-4xl rounded-sm border border-[#b9a98f] p-8 sm:p-14 ${
                pageTurning ? "page-turn" : ""
              }`}
            >
              {caseData && (
                <>
                  {section === "cover" && (
                    <div className="flex min-h-[620px] flex-col">
                      <div className="mb-16 flex justify-between">
                        <div className="typewriter text-xs tracking-widest">
                          DEDUCTION BOSHQARMASI
                        </div>

                        <div className="stamp px-3 py-1 text-xs font-bold">
                          MAXFIY
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="typewriter mb-5 text-xs tracking-[0.3em] text-[#766858]">
                          TERGOV ISHI
                        </div>

                        <h2 className="typewriter max-w-2xl text-4xl font-bold leading-tight">
                          {caseData.title}
                        </h2>

                        <div className="mt-10 max-w-2xl border-l-4 border-[#8d302b] pl-6 text-lg leading-relaxed">
                          {caseData.plot_summary}
                        </div>
                      </div>

                      <div className="border-t border-[#b9a98f] pt-6">
                        <div className="typewriter text-xs text-[#766858]">
                          MUNDARIJA
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {[
                            ["details", "01 · ISH TAFSILOTLARI"],
                            ["suspects", "02 · GUMON QILINUVCHILAR"],
                            ["clues", "03 · DALILLAR"],
                            ["verdict", "04 · XULOSA"],
                          ].map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => goToSection(key as Section)}
                              className="paper-line flex justify-between py-3 text-left transition hover:pl-3"
                            >
                              <span>{label}</span>
                              <span>→</span>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={openWatson}
                          className="typewriter mt-6 w-full border border-[#4a3b28] bg-[#2a2015] py-3 text-xs text-[#e7d7c1] transition hover:bg-[#3a2c1d]"
                        >
                          🎩 DR. WATSON FIKRI
                        </button>
                      </div>
                    </div>
                  )}

                  {section === "details" && (
                    <div>
                      <SectionHeader
                        number="01"
                        title="ISH TAFSILOTLARI"
                        onBack={() => goToSection("cover")}
                      />

                      <div className="mt-12 space-y-8">
                        <div>
                          <div className="typewriter mb-2 text-xs text-[#766858]">
                            ISH HOLATI
                          </div>

                          <div className="text-xl font-bold">
                            OCHIQ TERGOV
                          </div>
                        </div>

                        <div>
                          <div className="typewriter mb-2 text-xs text-[#766858]">
                            FAYL TAVSIFI
                          </div>

                          <p className="max-w-2xl text-lg leading-relaxed">
                            {caseData.plot_summary}
                          </p>
                        </div>

                        <div className="border-t border-[#b9a98f] pt-6">
                          <div className="typewriter text-xs text-[#766858]">
                            TERGOVCHI QAYDI
                          </div>

                          <p className="mt-4 italic text-[#665443]">
                            &quot;Har bir detal muhim. Ammo har bir dalil haqiqatni aytmaydi.&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {section === "suspects" && (
                    <div>
                      <SectionHeader
                        number="02"
                        title="GUMON QILINUVCHILAR"
                        onBack={() => goToSection("cover")}
                      />

                      <div className="mt-10 grid gap-5">
                        {caseData.solution_data.suspects.map((suspect, i) => {
                          const selected = selectedSuspects.has(suspect.name);

                          const culprit =
                            verdict &&
                            caseData.solution_data.culprit.includes(
                              suspect.name
                            );

                          return (
                            <div
                              key={suspect.name}
                              className={`border p-5 text-left transition ${
                                selected
                                  ? "border-[#8d302b] bg-[#e1d5bd]"
                                  : culprit
                                    ? "border-[#3f6947] bg-[#d7e1d2]"
                                    : "border-[#b9a98f] bg-[#e4d9c4]"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <svg
                                  width="56"
                                  height="56"
                                  viewBox="0 0 110 110"
                                  className="flex-shrink-0"
                                >
                                  <rect
                                    width="110"
                                    height="110"
                                    rx="4"
                                    fill={
                                      selected
                                        ? "#8d302b"
                                        : culprit
                                          ? "#3f6947"
                                          : "#1c1a17"
                                    }
                                  />

                                  <circle
                                    cx="55"
                                    cy="42"
                                    r="18"
                                    fill="#e4d9c4"
                                    opacity="0.9"
                                  />

                                  <path
                                    d="M20 95 Q20 62 55 62 Q90 62 90 95 Z"
                                    fill="#e4d9c4"
                                    opacity="0.9"
                                  />
                                </svg>

                                <div className="flex flex-1 items-start justify-between">
                                  <div>
                                    <div className="typewriter text-lg font-bold">
                                      {i + 1}. {suspect.name}
                                    </div>

                                    <div className="mt-3 text-sm">
                                      {suspect.description}
                                    </div>
                                  </div>

                                  <div className="typewriter text-xs">
                                    {selected
                                      ? "TANLANDI"
                                      : culprit
                                        ? "AYBDOR"
                                        : "?"}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 border-t border-[#b9a98f] pt-3 text-xs italic text-[#766858]">
                                ALIBI: {suspect.alibi}
                              </div>

                              <div className="mt-4 flex gap-3">
                                <button
                                  onClick={() => openChat(suspect.name)}
                                  className="typewriter flex-1 border border-[#4a3b28] bg-[#2a2015] py-2 text-xs text-[#e7d7c1] transition hover:bg-[#3a2c1d]"
                                >
                                  💬 SO'ROQ QILISH
                                </button>

                                {!verdict && (
                                  <button
                                    onClick={() =>
                                      toggleSuspect(suspect.name)
                                    }
                                    className={`typewriter flex-1 border py-2 text-xs transition ${
                                      selected
                                        ? "border-[#8d302b] bg-[#8d302b] text-[#f3e8d5]"
                                        : "border-[#766858] text-[#766858] hover:bg-[#d7c9ae]"
                                    }`}
                                  >
                                    {selected
                                      ? "✓ AYBDOR DEB BELGILANDI"
                                      : "AYBDOR DEB BELGILASH"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {section === "clues" && (
                    <div>
                      <SectionHeader
                        number="03"
                        title="DALILLAR"
                        onBack={() => goToSection("cover")}
                      />

                      <div className="mt-10 space-y-4">
                        {caseData.solution_data.clues.map((clue, i) => {
                          const revealed = revealedClues.has(i);
                          const decision = clueDecisions[i] ?? null;

                          const wasCorrect =
                            decision === "kept"
                              ? !clue.misleading
                              : decision === "dismissed"
                                ? clue.misleading
                                : null;

                          return (
                            <div
                              key={i}
                              className="border border-[#b9a98f] bg-[#e4d9c4]"
                            >
                              <button
                                onClick={() => toggleClue(i)}
                                className="w-full p-5 text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <ClueIcon index={i} />

                                  <div className="flex flex-1 items-center justify-between">
                                    <span className="typewriter text-sm font-bold">
                                      DALIL №{i + 1} · {clue.location}
                                    </span>

                                    <span className="text-xs">
                                      {revealed ? "YOPISH" : "OCHISH"}
                                    </span>
                                  </div>
                                </div>

                                {revealed && (
                                  <div className="mt-5 border-t border-[#b9a98f] pt-4">
                                    <p className="text-sm">
                                      {clue.description}
                                    </p>

                                    <p className="mt-3 text-sm italic text-[#766858]">
                                      {clue.relevance}
                                    </p>
                                  </div>
                                )}
                              </button>

                              {revealed && !decision && !verdict && (
                                <div className="flex gap-3 px-5 pb-5">
                                  <button
                                    onClick={() => decideClue(i, "kept")}
                                    className="flex-1 border border-[#3f6947] py-2 text-xs text-[#3f6947]"
                                  >
                                    ✓ MUHIM
                                  </button>

                                  <button
                                    onClick={() =>
                                      decideClue(i, "dismissed")
                                    }
                                    className="flex-1 border border-[#8d302b] py-2 text-xs text-[#8d302b]"
                                  >
                                    ✕ CHALG'ITUVCHI
                                  </button>
                                </div>
                              )}

                              {verdict && (
                                <div className="border-t border-[#b9a98f] p-4 text-xs">
                                  {wasCorrect === true &&
                                    "✓ TO'G'RI BAHOLANDI"}

                                  {wasCorrect === false &&
                                    "✕ XATO BAHOLANDI"}

                                  {wasCorrect === null &&
                                    "— BAHOLANMADI"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {section === "verdict" && (
                    <div>
                      <SectionHeader
                        number="04"
                        title="XULOSA"
                        onBack={() => goToSection("cover")}
                      />

                      <div className="mt-16 text-center">
                        {!verdict ? (
                          <>
                            <div className="typewriter text-sm text-[#766858]">
                              TERGOV YAKUNLANMAGAN
                            </div>

                            <p className="mx-auto mt-6 max-w-xl text-lg">
                              Barcha dalillarni tahlil qiling va haqiqiy aybdorni aniqlang.
                            </p>

                            <button
                              onClick={confirmVerdict}
                              disabled={selectedSuspects.size === 0}
                              className="mt-10 border-2 border-[#8d302b] bg-[#8d302b] px-8 py-4 text-sm font-bold text-[#f3e8d5] disabled:opacity-30"
                            >
                              FAYLNI YOPISH
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              className={`typewriter text-3xl font-bold ${
                                verdict === "correct"
                                  ? "text-[#3f6947]"
                                  : "text-[#8d302b]"
                              }`}
                            >
                              {verdict === "correct"
                                ? "✓ TERGOV YAKUNLANDI"
                                : "✕ NOTO'G'RI XULOSA"}
                            </div>

                            <div className="mx-auto mt-10 max-w-xl border-y border-[#b9a98f] py-8">
                              <div className="typewriter text-xs text-[#766858]">
                                HAQIQIY AYBDOR
                              </div>

                              <div className="mt-4 text-2xl font-bold">
                                {caseData.solution_data.culprit.join(", ")}
                              </div>
                            </div>

                            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed">
                              {caseData.solution_data.explanation}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {chatSuspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div
              className="flex max-h-[80vh] w-full max-w-lg flex-col border border-[#513521]"
              style={{ backgroundColor: "#1a1512" }}
            >
              <div className="flex items-center gap-3 border-b border-[#513521] p-4">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 110 110"
                  className="flex-shrink-0"
                >
                  <rect width="110" height="110" rx="4" fill="#8d302b" />

                  <circle
                    cx="55"
                    cy="42"
                    r="18"
                    fill="#e4d9c4"
                    opacity="0.9"
                  />

                  <path
                    d="M20 95 Q20 62 55 62 Q90 62 90 95 Z"
                    fill="#e4d9c4"
                    opacity="0.9"
                  />
                </svg>

                <div className="flex-1">
                  <div className="typewriter text-xs text-[#8d7861]">
                    SO'ROQ XONASI
                  </div>

                  <div className="typewriter text-lg font-bold text-[#d8cdbb]">
                    {chatSuspect}
                  </div>
                </div>

                <button
                  onClick={closeChat}
                  className="typewriter text-xs text-[#8d7861] transition hover:text-[#d8cdbb]"
                >
                  ✕ YOPISH
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatMessages.length === 0 && (
                  <div className="typewriter text-center text-xs text-[#665443]">
                    Savolingizni yozing va so'roqni boshlang...
                  </div>
                )}

                {chatMessages.map((msg, i) => {
                  const badge =
                    msg.role === "assistant"
                      ? moodBadge(msg.mood)
                      : null;

                  return (
                    <div key={i}>
                      {badge && (
                        <div
                          className="typewriter mb-1 text-xs"
                          style={{ color: badge.color }}
                        >
                          {badge.emoji} {badge.label}
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] p-3 text-sm ${
                          msg.role === "user"
                            ? "ml-auto border border-[#8d302b] bg-[#291614] text-[#e7d7c1]"
                            : "border bg-[#241d16] text-[#d8cdbb]"
                        }`}
                        style={
                          msg.role === "assistant" && badge
                            ? { borderColor: badge.color }
                            : undefined
                        }
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="typewriter text-xs text-[#665443]">
                    {chatSuspect} javob yozmoqda...
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-[#513521] p-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChatMessage();
                  }}
                  disabled={chatLoading}
                  placeholder="Savolingizni yozing..."
                  className="flex-1 border border-[#4a3b28] bg-[#100d0a] px-3 py-2 text-sm text-[#d8cdbb] outline-none focus:border-[#8d302b]"
                />

                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="typewriter border border-[#8d302b] bg-[#64221e] px-4 py-2 text-xs text-[#e7d7c1] transition hover:bg-[#852c26] disabled:opacity-40"
                >
                  YUBORISH
                </button>
              </div>
            </div>
          </div>
        )}

        {watsonOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div
              className="flex max-h-[80vh] w-full max-w-lg flex-col border border-[#3d5a45]"
              style={{ backgroundColor: "#141a16" }}
            >
              <div className="flex items-center gap-3 border-b border-[#3d5a45] p-4">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: "#3f6947" }}
                >
                  🎩
                </div>
                <div className="flex-1">
                  <div className="typewriter text-xs text-[#8ba893]">
                    MASLAHAT XONASI
                  </div>
                  <div className="typewriter text-lg font-bold text-[#d8e8dc]">
                    Doktor Vatson
                  </div>
                </div>
                <button
                  onClick={closeWatson}
                  className="typewriter text-xs text-[#8ba893] transition hover:text-[#d8e8dc]"
                >
                  ✕ YOPISH
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {watsonMessages.length === 0 && (
                  <div className="typewriter text-center text-xs text-[#5f7568]">
                    Doktor Vatsondan tergov bo'yicha fikr so'rang...
                  </div>
                )}
                {watsonMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] p-3 text-sm ${
                      msg.role === "user"
                        ? "ml-auto border border-[#8d302b] bg-[#291614] text-[#e7d7c1]"
                        : "border border-[#3d5a45] bg-[#1c2620] text-[#d8e8dc]"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {watsonLoading && (
                  <div className="typewriter text-xs text-[#5f7568]">
                    Doktor Vatson o'ylamoqda...
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-[#3d5a45] p-4">
                <input
                  type="text"
                  value={watsonInput}
                  onChange={(e) => setWatsonInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendWatsonMessage();
                  }}
                  disabled={watsonLoading}
                  placeholder="Fikringizni yozing..."
                  className="flex-1 border border-[#3d5a45] bg-[#100d0a] px-3 py-2 text-sm text-[#d8e8dc] outline-none focus:border-[#5fae74]"
                />
                <button
                  onClick={sendWatsonMessage}
                  disabled={watsonLoading || !watsonInput.trim()}
                  className="typewriter border border-[#3f6947] bg-[#2a3f2e] px-4 py-2 text-xs text-[#d8e8dc] transition hover:bg-[#3a523e] disabled:opacity-40"
                >
                  YUBORISH
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="typewriter text-sm tracking-widest text-[#d8cdbb]">
              FAYL TAYYORLANMOQDA...
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
