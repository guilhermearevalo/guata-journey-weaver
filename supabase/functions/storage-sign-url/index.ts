import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
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

/** Path must be referenced in public CMS/testimonial content before anon signing. */
async function isPublicReferencedPath(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
): Promise<boolean> {
  const publicUrlSuffix = `/storage/v1/object/public/${bucket}/${path}`;

  if (bucket === "testimonials") {
    const { count } = await admin
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .or(`photo_url.ilike.%${path}%,photo_url.ilike.%${publicUrlSuffix}%`);
    return (count ?? 0) > 0;
  }

  if (bucket === "site-assets") {
    const { data: settings } = await admin
      .from("site_settings")
      .select("value")
      .in("key", ["cadastur_config", "contact_info", "agency_location"]);
    const blob = JSON.stringify(settings ?? []);
    return blob.includes(path) || blob.includes(publicUrlSuffix);
  }

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceRoleKey);

    let maySign = false;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        const { data: staff } = await admin.rpc("is_staff", { _user_id: user.id });
        maySign = staff === true || (await isPublicReferencedPath(admin, bucket, path));
      }
    }

    if (!maySign) {
      maySign = await isPublicReferencedPath(admin, bucket, path);
    }

    if (!maySign) {
      return json({ error: "Forbidden" }, 403);
    }

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
