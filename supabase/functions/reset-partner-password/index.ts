import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

    const { data: claims } = await supabaseUser.auth.getUser();
    if (!claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: claims.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { agency_id, mode } = await req.json();
    if (!agency_id) {
      return new Response(JSON.stringify({ error: "agency_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find the partner user linked to this agency
    const { data: link } = await supabaseAdmin.from("partner_users").select("user_id").eq("agency_id", agency_id).maybeSingle();
    if (!link) {
      return new Response(JSON.stringify({ error: "Nenhum usuário vinculado a esta agência. Use 'Convidar parceiro' antes." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user email
    const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(link.user_id);
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const email = userResp.user.email;

    if (mode === "email") {
      // Send recovery email so partner sets own password
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email!,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, mode: "email", email }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default: generate temporary password
    const tempPassword = generatePassword();
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(link.user_id, { password: tempPassword });
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, mode: "temporary", email, temporary_password: tempPassword }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
