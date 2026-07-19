import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "rahmonjon303@icloud.com";

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string;
};

function getUserFullName(user: any) {
  const metadata = user.user_metadata ?? {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    metadata.fullName;

  if (fullName && String(fullName).trim()) {
    return String(fullName).trim();
  }

  return user.email || "Foydalanuvchi";
}

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return null;
  }

  const { data, error } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function checkAdmin(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Foydalanuvchi aniqlanmadi",
        },
        { status: 401 }
      ),
    };
  }

  const userEmail = user.email?.toLowerCase().trim();

  const isAdmin =
    userEmail === ADMIN_EMAIL.toLowerCase().trim();

  if (!isAdmin) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Admin ruxsati kerak",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function GET(request: Request) {
  try {
    const adminCheck = await checkAdmin(request);

    if (adminCheck.response) {
      return adminCheck.response;
    }

    const adminUserId = adminCheck.user!.id;

    // 🔹 BARCHA USERLAR
    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      console.error("Users fetch error:", usersError);

      return NextResponse.json(
        {
          error: usersError.message,
        },
        { status: 500 }
      );
    }

    const users: AdminUser[] = usersData.users.map(
      (user) => ({
        id: user.id,
        email: user.email ?? null,
        full_name: getUserFullName(user),
      })
    );

    // 🔹 BARCHA CASE'LAR
    const { data: cases, error: casesError } =
      await supabaseAdmin
        .from("cases")
        .select(
          "id, fingerprint, title, plot_summary, created_at, user_id"
        )
        .order("created_at", {
          ascending: false,
        });

    if (casesError) {
      console.error(
        "Admin cases fetch error:",
        casesError
      );

      return NextResponse.json(
        {
          error: casesError.message,
        },
        { status: 500 }
      );
    }

    // 🔹 USER MAP
    const userMap = new Map<string, AdminUser>();

    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // 🔹 CASE'LARGA OWNER QO'SHISH
    const enrichedCases = (cases ?? []).map(
      (item) => {
        const owner = item.user_id
          ? userMap.get(item.user_id)
          : null;

        return {
          ...item,

          owner: owner
            ? {
                id: owner.id,
                email: owner.email,
                full_name: owner.full_name,
              }
            : null,
        };
      }
    );

    // 🔥 ADMIN CASE'LARI
    const adminCases = enrichedCases.filter(
      (item) =>
        item.user_id === adminUserId
    );

    // 🔥 USER CASE'LARI
    const userCases = enrichedCases.filter(
      (item) =>
        item.user_id !== adminUserId
    );

    // 🔥 BARCHA USERLAR
    // CASE YO'Q USERLAR HAM YO'QOLMAYDI
    const userFolders = users
      .filter(
        (user) =>
          user.id !== adminUserId
      )
      .map((user) => ({
        ...user,

        cases: userCases.filter(
          (item) =>
            item.user_id === user.id
        ),
      }));

    return NextResponse.json({
      success: true,

      adminCases,

      allCases: enrichedCases,

      users: userFolders,

      stats: {
        totalCases: enrichedCases.length,

        totalUsers: users.length,

        adminCases: adminCases.length,

        userCases: userCases.length,
      },
    });
  } catch (err: any) {
    console.error(
      "Admin cases API error:",
      err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}