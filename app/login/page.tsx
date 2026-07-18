"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center text-[#d8cdbb]"
      style={{
        backgroundColor: "#100d0a",
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(120, 77, 38, 0.18), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(0, 0, 0, 0.8), transparent 70%)",
      }}
    >
      <div className="w-full max-w-md px-6">
        <div className="mb-10 text-center">
          <div
            className="mb-3 text-xs tracking-[0.45em] text-[#8d7861]"
            style={{ fontFamily: "monospace" }}
          >
            POLICE DEPARTMENT · ACCESS CONTROL
          </div>
          <h1
            className="text-5xl font-bold tracking-[0.25em] text-[#d8cdbb]"
            style={{ fontFamily: "monospace" }}
          >
            DEDUCTION
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[#513521] p-8"
          style={{
            background:
              "linear-gradient(180deg, #352218, #1a100b 60%, #0d0906)",
          }}
        >
          <div
            className="mb-6 text-xs tracking-[0.35em] text-[#aa8b6b]"
            style={{ fontFamily: "monospace" }}
          >
            {mode === "login" ? "TIZIMGA KIRISH" : "RO'YXATDAN O'TISH"}
          </div>

          <div className="mb-4">
            <label
              className="mb-2 block text-xs text-[#8d7861]"
              style={{ fontFamily: "monospace" }}
            >
              EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#68482d] bg-[#1a100b] px-4 py-3 text-[#d8cdbb] outline-none focus:border-[#8d302b]"
              placeholder="email@example.com"
            />
          </div>

          <div className="mb-6">
            <label
              className="mb-2 block text-xs text-[#8d7861]"
              style={{ fontFamily: "monospace" }}
            >
              PAROL
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#68482d] bg-[#1a100b] px-4 py-3 text-[#d8cdbb] outline-none focus:border-[#8d302b]"
              placeholder="Kamida 6 ta belgi"
            />
          </div>

          {error && (
            <div className="mb-4 border border-[#8d302b] bg-[#291614] p-3 text-sm text-[#d9958b]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-[#8d302b] bg-[#64221e] px-6 py-3 text-sm tracking-widest text-[#e7d7c1] transition hover:bg-[#852c26] disabled:opacity-40"
            style={{ fontFamily: "monospace" }}
          >
            {loading
              ? "ISHLANMOQDA..."
              : mode === "login"
              ? "KIRISH"
              : "RO'YXATDAN O'TISH"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="mt-4 w-full text-center text-xs text-[#8d7861] transition hover:text-[#d8cdbb]"
            style={{ fontFamily: "monospace" }}
          >
            {mode === "login"
              ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting"
              : "Hisobingiz bormi? Kiring"}
          </button>
        </form>
      </div>
    </main>
  );
}
