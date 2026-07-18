"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

type CaseItem = {
  id: string;
  title: string;
  plot_summary: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data } = await supabaseBrowser.auth.getSession();

    if (!data.session) {
      router.push("/login");
      return;
    }

    loadCases();
  }

  async function loadCases() {
    try {
      setLoading(true);

      const res = await fetch("/api/cases");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Fayllarni yuklashda xato");
      }

      setCases(json.cases ?? []);
    } catch (err: any) {
      setError(err.message || "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCase(id: string) {
    const confirmed = confirm(
      "Bu tergov faylini o'chirishga ishonchingiz komilmi?"
    );

    if (!confirmed) return;

    try {
      setDeleting(id);

      const res = await fetch(`/api/admin/cases/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "O'chirishda xato");
      }

      setCases((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "O'chirishda xato");
    } finally {
      setDeleting(null);
    }
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#100d0a] text-[#d8cdbb]">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #100d0a;
        }

        .typewriter {
          font-family: monospace;
          letter-spacing: 0.08em;
        }

        .admin-bg {
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
      `}</style>

      <div className="admin-bg min-h-screen">
        <header className="border-b border-[#3c2b1c] bg-[#15100c]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
            <div>
              <div className="typewriter text-xs text-[#8d7861]">
                DEDUCTION · BOSHQARUV
              </div>

              <h1 className="typewriter mt-3 text-2xl font-bold tracking-widest">
                ADMIN PANEL
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className="typewriter text-xs text-[#8d7861] transition hover:text-[#d8cdbb]"
              >
                ← O'YINGA QAYTISH
              </button>

              <button
                onClick={logout}
                className="typewriter text-xs text-[#8d7861] transition hover:text-[#d8cdbb]"
              >
                CHIQISH →
              </button>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-8 py-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="border border-[#513521] bg-[#1a120d] p-6">
              <div className="typewriter text-xs text-[#8d7861]">
                JAMI FAYLLAR
              </div>

              <div className="mt-4 text-4xl font-bold">{cases.length}</div>
            </div>

            <div className="border border-[#513521] bg-[#1a120d] p-6">
              <div className="typewriter text-xs text-[#8d7861]">
                HOLAT
              </div>

              <div className="mt-4 text-xl font-bold text-[#5fae74]">
                TIZIM FAOL
              </div>
            </div>

            <div className="border border-[#513521] bg-[#1a120d] p-6">
              <div className="typewriter text-xs text-[#8d7861]">
                BOSHQARUV
              </div>

              <div className="mt-4 text-xl font-bold">ADMIN</div>
            </div>
          </div>

          <div className="mt-10 border border-[#513521] bg-[#15100c]">
            <div className="flex items-center justify-between border-b border-[#3c2b1c] p-6">
              <div>
                <div className="typewriter text-xs text-[#8d7861]">
                  TERGOV ARXIVI
                </div>

                <h2 className="typewriter mt-2 text-xl font-bold">
                  BARCHA FAYLLAR
                </h2>
              </div>

              <button
                onClick={loadCases}
                className="typewriter border border-[#513521] px-4 py-2 text-xs transition hover:bg-[#2a1d14]"
              >
                ↻ YANGILASH
              </button>
            </div>

            {error && (
              <div className="m-6 border border-[#8d302b] bg-[#291614] p-4 text-sm text-[#d9958b]">
                XATO: {error}
              </div>
            )}

            {loading ? (
              <div className="p-16 text-center">
                <div className="typewriter text-xs text-[#8d7861]">
                  YUKLANMOQDA...
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mb-4 text-5xl opacity-30">🗃️</div>

                <div className="typewriter text-xs text-[#8d7861]">
                  ARXIV BO'SH
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#3c2b1c]">
                {cases.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-6 p-6 transition hover:bg-[#1c140f]"
                  >
                    <div className="typewriter w-16 text-xs text-[#8d7861]">
                      #{String(index + 1).padStart(3, "0")}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold">{item.title}</div>

                      <div className="mt-2 line-clamp-2 text-sm text-[#8d7861]">
                        {item.plot_summary}
                      </div>

                      <div className="typewriter mt-3 text-[10px] text-[#665443]">
                        {new Date(item.created_at).toLocaleString("uz-UZ")}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCase(item.id)}
                      disabled={deleting === item.id}
                      className="typewriter border border-[#8d302b] px-4 py-3 text-xs text-[#d9958b] transition hover:bg-[#64221e] disabled:opacity-40"
                    >
                      {deleting === item.id ? "..." : "🗑 O'CHIRISH"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}