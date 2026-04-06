import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

// Max chunk size from @supabase/ssr's chunker.js
const MAX_CHUNK_SIZE = 3180;

setup("authenticate test user", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const testEmail = process.env.TEST_USER_EMAIL;

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !testEmail) {
    throw new Error(
      "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL",
    );
  }

  // Step 1: Generate a magic link token via admin API
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });

  if (linkError || !linkData.properties.hashed_token) {
    throw new Error(`Failed to generate magic link: ${linkError?.message}`);
  }

  // Step 2: Verify the token server-side to get a session — no browser redirect needed.
  // This sidesteps the implicit vs PKCE flow issue entirely.
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: verifyData, error: verifyError } =
    await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

  if (verifyError || !verifyData.session) {
    throw new Error(`Failed to verify OTP: ${verifyError?.message}`);
  }

  const session = verifyData.session;

  // Step 3: Inject the session into the browser context as @supabase/ssr cookies.
  // Cookie name: sb-{project-ref}-auth-token, chunked if encodeURIComponent(value) > 3180.
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieKey = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify(session);
  const encodedValue = encodeURIComponent(sessionJson);

  const rawChunks: string[] = [];
  let remaining = encodedValue;
  while (remaining.length > 0) {
    let head = remaining.slice(0, MAX_CHUNK_SIZE);
    const lastEscape = head.lastIndexOf("%");
    if (lastEscape > MAX_CHUNK_SIZE - 3) {
      head = head.slice(0, lastEscape);
    }
    rawChunks.push(decodeURIComponent(head));
    remaining = remaining.slice(head.length);
  }

  const cookiePairs =
    rawChunks.length === 1
      ? [{ name: cookieKey, value: rawChunks[0] }]
      : rawChunks.map((value, i) => ({ name: `${cookieKey}.${i}`, value }));

  await page.context().addCookies(
    cookiePairs.map(({ name, value }) => ({
      name,
      value,
      domain: "localhost",
      path: "/",
      sameSite: "Lax" as const,
      httpOnly: false,
      secure: false,
    })),
  );

  // Step 4: Verify the session works by navigating to the dashboard
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");

  await page.context().storageState({ path: authFile });
});
