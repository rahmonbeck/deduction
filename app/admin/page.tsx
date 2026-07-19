"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

type Owner = {
  id: string;
  email: string | null;
  full_name: string;
};

type CaseItem = {
  id: string;
  fingerprint: string;
  title: string;
  plot_summary: string;
  created_at: string;
  user_id: string;
  owner: Owner | null;
};

type UserFolder = Owner & {
  cases: CaseItem[];
};

type AdminData = {
  adminCases: CaseItem[];
  allCases: CaseItem[];
  users: UserFolder[];
  stats: {
    totalCases: number;
    totalUsers: number;
    adminCases: number;
    userCases: number;
  };
};

type Tab = "admin" | "all" | "users";

export default function AdminPage() {
  const router = useRouter();

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("admin");
  const [openedUser, setOpenedUser] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function getToken() {
    const { data } = await supabaseBrowser.auth.getSession();

    return data.session?.access_token;
  }

  async function checkAdmin() {
    try {
      const { data: sessionData } =
        await supabaseBrowser.auth.getSession();

      if (!sessionData.session) {
        router.push("/login");
        return;
      }

      await loadData();
    } catch (err: any) {
      setError(err?.message || "Tizim xatosi");
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/admin/cases", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      let json: any = {};

      if (text.trim()) {
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            `Server noto'g'ri javob qaytardi (${res.status})`
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          json?.error ||
            `Ma'lumotlarni yuklashda xato (${res.status})`
        );
      }

      setData({
        adminCases: json.adminCases ?? [],
        allCases: json.allCases ?? [],
        users: json.users ?? [],
        stats: json.stats ?? {
          totalCases: 0,
          totalUsers: 0,
          adminCases: 0,
          userCases: 0,
        },
      });
    } catch (err: any) {
      console.error("Admin data error:", err);

      setError(err?.message || "Xato yuz berdi");
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

      const token = await getToken();

      if (!token) {
        throw new Error("Sessiya topilmadi");
      }

      const res = await fetch(`/api/admin/cases/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      let json: any = {};

      if (text.trim()) {
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            `Server noto'g'ri javob qaytardi (${res.status})`
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          json?.error ||
            `O'chirishda xato (${res.status})`
        );
      }

      await loadData();
    } catch (err: any) {
      console.error("Delete case error:", err);

      alert(err?.message || "O'chirishda xato");
    } finally {
      setDeleting(null);
    }
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();

    router.push("/login");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("uz-UZ");
  }

  function renderCase(item: CaseItem, index: number) {
    return (
      <div
        key={item.id}
        className="case-row"
      >
        <div className="case-number">
          #{String(index + 1).padStart(3, "0")}
        </div>

        <div className="case-content">
          <div className="case-title">
            {item.title}
          </div>

          <div className="case-description">
            {item.plot_summary}
          </div>

          <div className="case-date">
            {formatDate(item.created_at)}
          </div>
        </div>

        <button
          onClick={() => deleteCase(item.id)}
          disabled={deleting === item.id}
          className="delete-button"
        >
          {deleting === item.id
            ? "..."
            : "🗑 O'CHIRISH"}
        </button>
      </div>
    );
  }

  function renderAdminCases() {
    if (!data) return null;

    if (data.adminCases.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🗃️</div>

          <div className="typewriter">
            ADMIN ARXIVI BO'SH
          </div>
        </div>
      );
    }

    return (
      <div>
        {data.adminCases.map((item, index) =>
          renderCase(item, index)
        )}
      </div>
    );
  }

  function renderAllCases() {
    if (!data) return null;

    if (data.allCases.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🗃️</div>

          <div className="typewriter">
            ARXIV BO'SH
          </div>
        </div>
      );
    }

    return (
      <div>
        {data.allCases.map((item, index) => (
          <div
            key={item.id}
            className="case-row"
          >
            <div className="case-number">
              #{String(index + 1).padStart(3, "0")}
            </div>

            <div className="case-content">
              <div className="case-title">
                {item.title}
              </div>

              <div className="case-owner">
                👤{" "}
                {item.owner?.full_name ||
                  item.owner?.email ||
                  "Foydalanuvchi"}
              </div>

              {item.owner?.email && (
                <div className="case-email">
                  {item.owner.email}
                </div>
              )}

              <div className="case-description">
                {item.plot_summary}
              </div>

              <div className="case-date">
                {formatDate(item.created_at)}
              </div>
            </div>

            <button
              onClick={() => deleteCase(item.id)}
              disabled={deleting === item.id}
              className="delete-button"
            >
              {deleting === item.id
                ? "..."
                : "🗑 O'CHIRISH"}
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderUsers() {
    if (!data) return null;

    if (data.users.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">👥</div>

          <div className="typewriter">
            FOYDALANUVCHILAR TOPILMADI
          </div>
        </div>
      );
    }

    return (
      <div className="users-list">
        {data.users.map((user) => {
          const isOpened = openedUser === user.id;

          return (
            <div
              key={user.id}
              className="user-folder"
            >
              <button
                onClick={() =>
                  setOpenedUser(
                    isOpened ? null : user.id
                  )
                }
                className="user-header"
              >
                <div className="user-icon">
                  {isOpened ? "📂" : "📁"}
                </div>

                <div className="user-info">
                  <div className="user-name">
                    {user.full_name}
                  </div>

                  <div className="user-email">
                    {user.email || "Email mavjud emas"}
                  </div>
                </div>

                <div className="user-count">
                  {user.cases.length} TA FAYL
                </div>

                <div className="folder-arrow">
                  {isOpened ? "⌃" : "⌄"}
                </div>
              </button>

              {isOpened && (
                <div className="user-cases">
                  {user.cases.map((item, index) =>
                    renderCase(item, index)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
          min-height: 100vh;

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

        .header {
          border-bottom: 1px solid #3c2b1c;
          background: #15100c;
        }

        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 32px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-label {
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #8d7861;
        }

        .brand-title {
          margin-top: 10px;

          font-family: monospace;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 0.14em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .header-button {
          border: 0;
          background: transparent;

          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;

          color: #8d7861;

          cursor: pointer;

          transition: color 0.2s ease;
        }

        .header-button:hover {
          color: #d8cdbb;
        }

        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 26px 32px 60px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .stat-card {
          border: 1px solid #513521;
          background: #1a120d;
          padding: 22px;
        }

        .stat-label {
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #8d7861;
        }

        .stat-value {
          margin-top: 12px;
          font-size: 32px;
          font-weight: bold;
        }

        .stat-green {
          color: #5fae74;
        }

        .archive {
          margin-top: 26px;

          border: 1px solid #513521;
          background: #15100c;
        }

        .archive-header {
          padding: 20px 22px;

          border-bottom: 1px solid #3c2b1c;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .archive-label {
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #8d7861;
        }

        .archive-title {
          margin-top: 8px;

          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 0.08em;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tab {
          border: 1px solid #513521;
          background: transparent;

          padding: 10px 16px;

          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;

          color: #8d7861;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        .tab:hover {
          background: #2a1d14;
          color: #d8cdbb;
        }

        .tab-active {
          border-color: #8d302b;
          background: #64221e;
          color: #f0dfc8;
        }

        .error {
          margin: 22px;

          border: 1px solid #8d302b;
          background: #291614;

          padding: 16px;

          font-size: 13px;
          color: #d9958b;
        }

        .case-row {
          display: flex;
          align-items: center;
          gap: 22px;

          padding: 22px;

          border-bottom: 1px solid #3c2b1c;

          transition: background 0.2s ease;
        }

        .case-row:hover {
          background: #1c140f;
        }

        .case-number {
          width: 48px;

          flex-shrink: 0;

          font-family: monospace;
          font-size: 10px;

          color: #8d7861;
        }

        .case-content {
          min-width: 0;
          flex: 1;
        }

        .case-title {
          font-size: 16px;
          font-weight: bold;
        }

        .case-owner {
          margin-top: 7px;

          font-family: monospace;
          font-size: 11px;

          color: #c9a227;
        }

        .case-email {
          margin-top: 4px;

          font-family: monospace;
          font-size: 10px;

          color: #8d7861;
        }

        .case-description {
          margin-top: 8px;

          display: -webkit-box;
          overflow: hidden;

          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;

          font-size: 12px;
          line-height: 1.5;

          color: #8d7861;
        }

        .case-date {
          margin-top: 8px;

          font-family: monospace;
          font-size: 9px;

          color: #665443;
        }

        .delete-button {
          flex-shrink: 0;

          border: 1px solid #8d302b;
          background: transparent;

          padding: 11px 15px;

          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.06em;

          color: #d9958b;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .delete-button:hover {
          background: #64221e;
          color: #f0dfc8;
        }

        .delete-button:disabled {
          opacity: 0.4;
          cursor: wait;
        }

        .empty-state {
          padding: 80px 20px;

          text-align: center;

          color: #8d7861;
        }

        .empty-icon {
          margin-bottom: 16px;

          font-size: 50px;

          opacity: 0.3;
        }

        .users-list {
          padding: 14px;
        }

        .user-folder {
          margin-bottom: 10px;

          border: 1px solid #513521;
          background: #1a120d;
        }

        .user-header {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 16px;

          border: 0;
          background: transparent;

          padding: 18px 20px;

          text-align: left;

          color: #d8cdbb;

          cursor: pointer;

          transition: background 0.2s ease;
        }

        .user-header:hover {
          background: #241811;
        }

        .user-icon {
          font-size: 26px;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 16px;
          font-weight: bold;
        }

        .user-email {
          margin-top: 5px;

          font-family: monospace;
          font-size: 10px;

          color: #8d7861;
        }

        .user-count {
          font-family: monospace;
          font-size: 10px;

          color: #c9a227;
        }

        .folder-arrow {
          width: 25px;

          font-size: 18px;
          text-align: center;

          color: #8d7861;
        }

        .user-cases {
          border-top: 1px solid #3c2b1c;

          background: #120d09;
        }

        .user-cases .case-row {
          padding-left: 58px;
        }

        @media (max-width: 1000px) {
          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .archive-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .tabs {
            width: 100%;
          }

          .tab {
            flex: 1;
          }
        }

        @media (max-width: 700px) {
          .header-inner,
          .main {
            padding-left: 16px;
            padding-right: 16px;
          }

          .header-inner {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .case-row {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .case-number {
            width: auto;
          }

          .case-content {
            width: calc(100% - 70px);
          }

          .delete-button {
            width: 100%;
          }

          .user-header {
            flex-wrap: wrap;
          }

          .user-count {
            margin-left: 42px;
            width: calc(100% - 42px);
          }
        }
      `}</style>

      <div className="admin-bg">
        <header className="header">
          <div className="header-inner">
            <div>
              <div className="brand-label">
                DEDUCTION · BOSHQARUV
              </div>

              <h1 className="brand-title">
                ADMIN PANEL
              </h1>
            </div>

            <div className="header-actions">
              <button
                onClick={() => router.push("/")}
                className="header-button"
              >
                ← O'YINGA QAYTISH
              </button>

              <button
                onClick={logout}
                className="header-button"
              >
                CHIQISH →
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">
                JAMI FAYLLAR
              </div>

              <div className="stat-value">
                {data?.stats.totalCases ?? 0}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                FOYDALANUVCHILAR
              </div>

              <div className="stat-value">
                {data?.stats.totalUsers ?? 0}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                ADMIN FAYLLARI
              </div>

              <div className="stat-value">
                {data?.stats.adminCases ?? 0}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                HOLAT
              </div>

              <div className="stat-value stat-green">
                TIZIM FAOL
              </div>
            </div>
          </div>

          <section className="archive">
            <div className="archive-header">
              <div>
                <div className="archive-label">
                  DEDUCTION · ADMINISTRATSIYA
                </div>

                <h2 className="archive-title">
                  TERGOV ARXIVI
                </h2>
              </div>

              <div className="tabs">
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`tab ${
                    activeTab === "admin"
                      ? "tab-active"
                      : ""
                  }`}
                >
                  📁 ADMIN
                </button>

                <button
                  onClick={() => setActiveTab("all")}
                  className={`tab ${
                    activeTab === "all"
                      ? "tab-active"
                      : ""
                  }`}
                >
                  🗃 UMUMIY
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className={`tab ${
                    activeTab === "users"
                      ? "tab-active"
                      : ""
                  }`}
                >
                  👥 USERS
                </button>

                <button
                  onClick={loadData}
                  className="tab"
                >
                  ↻ YANGILASH
                </button>
              </div>
            </div>

            {error && (
              <div className="error">
                XATO: {error}
              </div>
            )}

            {loading ? (
              <div className="empty-state">
                <div className="typewriter">
                  YUKLANMOQDA...
                </div>
              </div>
            ) : (
              <>
                {activeTab === "admin" &&
                  renderAdminCases()}

                {activeTab === "all" &&
                  renderAllCases()}

                {activeTab === "users" &&
                  renderUsers()}
              </>
            )}
          </section>
        </main>
      </div>
    </main>
  );
}