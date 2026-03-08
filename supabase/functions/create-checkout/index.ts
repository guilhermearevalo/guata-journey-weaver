import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposal_id, share_token } = await req.json();

    if (!proposal_id && !share_token) {
      throw new Error("proposal_id or share_token is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch proposal
    let query = supabaseAdmin.from("proposals").select(
      "id, title, total_price, payment_status, payment_enabled, share_token, request_id, agency_id, travel_requests!inner(client_name, client_email)"
    );

    if (share_token) {
      query = query.eq("share_token", share_token);
    } else {
      query = query.eq("id", proposal_id);
    }

    const { data: proposal, error: fetchError } = await query.maybeSingle();

    if (fetchError || !proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.payment_status === "paid") {
      throw new Error("This proposal is already paid");
    }

    if (!proposal.payment_enabled) {
      throw new Error("Payment is not enabled for this proposal");
    }

    if (!proposal.total_price || proposal.total_price <= 0) {
      throw new Error("Proposal has no valid price");
    }

    const travelRequest = proposal.travel_requests as unknown as {
      client_name: string;
      client_email: string;
    };

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({
      email: travelRequest.client_email,
      limit: 1,
    });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session with dynamic price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : travelRequest.client_email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: proposal.title,
              description: `Proposta de viagem - ${travelRequest.client_name}`,
            },
            unit_amount: Math.round(proposal.total_price * 100), // Convert to centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        proposal_id: proposal.id,
        share_token: proposal.share_token || "",
      },
      success_url: `${req.headers.get("origin")}/proposta/${proposal.share_token}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/proposta/${proposal.share_token}?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
