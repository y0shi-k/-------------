import { readFile } from "node:fs/promises";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index);
        const rawValue = line.slice(index + 1).trim();
        return [key, rawValue.replace(/^["']|["']$/g, "")];
      })
  );
}

function randomPassword() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `StockMaster-Test-${suffix}!2026`;
}

function cookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`).join("; ");
}

async function findUserByEmail(supabase, targetEmail) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

const env = {
  ...parseEnv(await readFile(new URL("../.env.local", import.meta.url), "utf8")),
  ...process.env
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = env.TEST_APP_URL || "http://localhost:3000";
const email = env.TEST_USER_EMAIL || "stock-master-test@example.com";
const password = env.TEST_USER_PASSWORD || randomPassword();

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase env is incomplete. Check web/.env.local.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const existingUser = await findUserByEmail(admin, email);
const userResult = existingUser
  ? await admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password
    })
  : await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

if (userResult.error) throw userResult.error;

const cookies = [];
const client = createBrowserClient(url, anonKey, {
  cookies: {
    getAll() {
      return cookies;
    },
    setAll(setCookies) {
      for (const setCookie of setCookies) {
        const index = cookies.findIndex((cookie) => cookie.name === setCookie.name);
        if (setCookie.options?.maxAge === 0) {
          if (index >= 0) cookies.splice(index, 1);
          continue;
        }
        const next = { name: setCookie.name, value: setCookie.value };
        if (index >= 0) cookies[index] = next;
        else cookies.push(next);
      }
    }
  }
});

const loginResult = await client.auth.signInWithPassword({ email, password });
if (loginResult.error || !loginResult.data.user) {
  throw new Error("Password login failed.");
}

const response = await fetch(appUrl, {
  headers: {
    Cookie: cookieHeader(cookies)
  },
  redirect: "manual"
});
const body = await response.text();
const launched = response.status === 200 && body.includes("料理レシピ・食材管理");

if (!launched) {
  throw new Error(`App launch failed. status=${response.status} location=${response.headers.get("location") ?? ""}`);
}

console.log(
  JSON.stringify(
    {
      appUrl,
      email,
      password,
      userId: loginResult.data.user.id,
      userStatus: existingUser ? "updated" : "created",
      loginVerified: true,
      appLaunchVerified: true
    },
    null,
    2
  )
);
