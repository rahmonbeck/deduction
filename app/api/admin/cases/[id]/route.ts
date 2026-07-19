import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "[rahmonjon303@icloud.com](mailto:rahmonjon303@icloud.com)";

type RouteContext = {
params: Promise<{ id: string }>;
};

async function getUser(request: Request) {
const authHeader = request.headers.get("authorization");

if (!authHeader?.startsWith("Bearer ")) {
return null;
}

const token = authHeader.replace("Bearer ", "").trim();

if (!token) {
return null;
}

const { data, error } =
await supabaseAdmin.auth.getUser(token);

if (error || !data.user) {
return null;
}

return data.user;
}

export async function GET(
request: Request,
{ params }: RouteContext
) {
try {
const user = await getUser(request);

```
if (!user) {
  return NextResponse.json(
    {
      error: "Sessiya topilmadi",
    },
    {
      status: 401,
    }
  );
}

const { id } = await params;

if (!id) {
  return NextResponse.json(
    {
      error: "Case ID topilmadi",
    },
    {
      status: 400,
    }
  );
}

const isAdmin =
  user.email?.toLowerCase().trim() ===
  ADMIN_EMAIL.toLowerCase().trim();

let query = supabaseAdmin
  .from("cases")
  .select(
    "id, fingerprint, title, plot_summary, solution_data, created_at, user_id"
  )
  .eq("id", id);

if (!isAdmin) {
  query = query.eq("user_id", user.id);
}

const { data, error } = await query.single();

if (error || !data) {
  return NextResponse.json(
    {
      error: "Tergov ishi topilmadi",
    },
    {
      status: 404,
    }
  );
}

return NextResponse.json({
  success: true,
  case: data,
});
```

} catch (err: any) {
console.error("Case GET error:", err);

```
return NextResponse.json(
  {
    error: err?.message || "Tergov ishini yuklashda xato",
  },
  {
    status: 500,
  }
);
```

}
}

export async function DELETE(
request: Request,
{ params }: RouteContext
) {
try {
const authHeader = request.headers.get("authorization");

```
if (!authHeader?.startsWith("Bearer ")) {
  return NextResponse.json(
    {
      error: "Token yo'q",
    },
    {
      status: 401,
    }
  );
}

const token = authHeader.replace("Bearer ", "").trim();

const { data: authData, error: authError } =
  await supabaseAdmin.auth.getUser(token);

if (
  authError ||
  !authData.user ||
  authData.user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
) {
  return NextResponse.json(
    {
      error: "Ruxsat yo'q",
    },
    {
      status: 403,
    }
  );
}

const { id } = await params;

const { error } = await supabaseAdmin
  .from("cases")
  .delete()
  .eq("id", id);

if (error) {
  return NextResponse.json(
    {
      error: error.message,
    },
    {
      status: 500,
    }
  );
}

return NextResponse.json({
  success: true,
});
```

} catch (err: any) {
return NextResponse.json(
{
error: err?.message || "Xato",
},
{
status: 500,
}
);
}
}
