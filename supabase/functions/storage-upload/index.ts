import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function canUpload(
  bucket: string,
  userId: string,
  path: string,
  admin: ReturnType<typeof createClient>,
): Promise<boolean> {
  if (bucket === "site-assets" || bucket === "testimonials") {
    const { data, error } = await admin.rpc("is_staff", { _user_id: userId });
    if (!error && data === true) return true;
    if (bucket === "testimonials") return true;
    return false;
  }
  if (bucket === "travel-documents") {
    const { data: staff } = await admin.rpc("is_staff", { _user_id: userId });
    if (staff === true) return true;
    return path.startsWith(`${userId}/`);
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const formData = await req.formData();
    const bucket = formData.get("bucket")?.toString() ?? "";
    const path = formData.get("path")?.toString() ?? "";
    const file = formData.get("file");
    const upsert = formData.get("upsert")?.toString() !== "false";
    const contentType = formData.get("contentType")?.toString();

    if (!bucket || !path || !(file instanceof File)) {
      return json({ error: "bucket, path and file are required" }, 400);
    }

    const allowed = await canUpload(bucket, user.id, path, admin);
    if (!allowed) {
      return json({ error: "Forbidden" }, 403);
    }

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
      upsert,
      contentType: contentType || file.type || undefined,
    });

    if (uploadError) {
      console.error("storage-upload error:", uploadError);
      return json({ error: uploadError.message }, 400);
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
    return json({ path, publicUrl: urlData.publicUrl });
  } catch (e) {
    console.error("storage-upload exception:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
