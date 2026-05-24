import { readFile } from "node:fs/promises";
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

const env = {
  ...parseEnv(await readFile(new URL("../.env.local", import.meta.url), "utf8")),
  ...process.env
};

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = env.TEST_USER_EMAIL || "stock-master-test@example.com";
const password = env.TEST_USER_PASSWORD || randomPassword();

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in web/.env.local.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findUserByEmail(targetEmail) {
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

const existingUser = await findUserByEmail(email);
const result = existingUser
  ? await supabase.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password
    })
  : await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

if (result.error) {
  throw result.error;
}

const loginClient = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({ email, password });

if (loginError || !loginData.user) {
  throw new Error("Test user was created or updated, but password login verification failed.");
}

await loginClient.auth.signOut();

console.log(
  JSON.stringify(
    {
      email,
      password,
      userId: result.data.user.id,
      status: existingUser ? "updated" : "created",
      loginVerified: true
    },
    null,
    2
  )
);
