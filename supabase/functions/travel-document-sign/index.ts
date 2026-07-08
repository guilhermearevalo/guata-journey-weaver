import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
};

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, documentId, code } = await req.json();
    if (!token || !documentId) {
      return json({ error: "token and documentId are required" }, 400);
    }

    if (!checkRateLimit(`${token}:${documentId}`)) {
      return json({ error: "Too many requests" }, 429);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: docRow, error: docError } = await admin
      .from("travel_documents")
      .select("file_path, proposal_id")
      .eq("id", documentId)
      .eq("visible_in_public", true)
      .maybeSingle();

    if (docError || !docRow?.file_path) {
      return json({ error: "Document not found" }, 404);
    }

    const { data: proposal, error: proposalError } = await admin
      .from("proposals")
      .select("share_token, share_enabled, access_code")
      .eq("id", docRow.proposal_id)
      .maybeSingle();

    if (proposalError || !proposal) {
      return json({ error: "Proposal not found" }, 404);
    }

    if (proposal.share_token !== token || proposal.share_enabled !== true) {
      return json({ error: "Unauthorized" }, 403);
    }

    if (proposal.access_code) {
      const provided = (code as string | undefined)?.trim().toUpperCase();
      if (!provided || provided !== proposal.access_code.trim().toUpperCase()) {
        return json({ error: "Invalid access code" }, 403);
      }
    }

    const { data: fileData, error: downloadError } = await admin.storage
      .from("travel-documents")
      .download(docRow.file_path);

    if (downloadError || !fileData) {
      console.error("travel-document-sign download error:", downloadError);
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
    console.error("travel-document-sign exception:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
