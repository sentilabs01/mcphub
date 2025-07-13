// @ts-nocheck
// Supabase Edge Function – runs in Deno runtime
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
// Supabase disallows secrets whose names begin with "SUPABASE_".
// We therefore read the Service-Role key from a custom env var instead.
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!; // this function URL
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    console.error("Google token exchange failed", txt);
    return new Response("Google token exchange failed", { status: 500 });
  }

  const tok = await tokenRes.json(); // access_token, refresh_token, expires_in

  // Build credentials object in the shape the front-end expects
  const creds = {
    // Front-end looks for any of these keys ↓
    token: tok.access_token,
    access_token: tok.access_token,
    accessToken: tok.access_token,
    refresh_token: tok.refresh_token,
    expiry_ts: Date.now() + (tok.expires_in || 3600) * 1000,
  };

  const GOOGLE_PROVIDERS = ['google_drive','gmail','google_calendar'];
  await supabase.from('user_integration_accounts').upsert(
    GOOGLE_PROVIDERS.map(p => ({ user_id: userId, provider: p, account_label: 'default', credentials: creds }))
  );

  // Redirect back to app UI
  return Response.redirect(`${APP_URL}/integrations?google=connected`, 302);
}); 