import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fileNameFromPath(path: string): string {
  const segment = path.split("/").pop() ?? "document";
  return segment.replace(/[^\w.\-() ]/g, "_") || "document";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return json({ error: "documentId is required" }, 400);
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

    const { data: allowed, error: accessError } = await admin.rpc("can_access_travel_document", {
      _document_id: documentId,
      _user_id: user.id,
    });
    if (accessError || !allowed) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: docRow, error: docError } = await admin
      .from("travel_documents")
      .select("file_path")
      .eq("id", documentId)
      .maybeSingle();

    if (docError || !docRow?.file_path) {
      return json({ error: "Document not found" }, 404);
    }

    const { data: fileData, error: downloadError } = await admin.storage
      .from("travel-documents")
      .download(docRow.file_path);

    if (downloadError || !fileData) {
      console.error("travel-document-open download error:", downloadError);
      return json({ error: downloadError?.message ?? "Failed to download file" }, 400);
    }

    const fileName = fileNameFromPath(docRow.file_path);
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        "Content-Type": fileData.type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("travel-document-open exception:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
