import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLIC_BUCKETS = new Set(["site-assets", "testimonials"]);

function isSafeStoragePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("..")) return false;
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bucket, path, expiresIn = 3600 } = await req.json();
    if (!bucket || !path || typeof bucket !== "string" || typeof path !== "string") {
      return json({ error: "bucket and path are required" }, 400);
    }
    if (!PUBLIC_BUCKETS.has(bucket)) {
      return json({ error: "Bucket not allowed" }, 403);
    }
    if (!isSafeStoragePath(path)) {
      return json({ error: "Invalid path" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) {
      console.error("storage-sign-url error:", error);
      return json({ error: error?.message ?? "Failed to sign URL" }, 400);
    }

    return json({ signedUrl: data.signedUrl });
  } catch (e) {
    console.error("storage-sign-url exception:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
