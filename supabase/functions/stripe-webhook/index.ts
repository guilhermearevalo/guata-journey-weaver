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

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  try {
    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
      }
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const proposalId = session.metadata?.proposal_id;

      if (proposalId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Update proposal payment status
        const { error } = await supabaseAdmin
          .from("proposals")
          .update({
            payment_status: "paid",
            payment_links: {
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              paid_at: new Date().toISOString(),
            },
          })
          .eq("id", proposalId);

        if (error) {
          console.error("Error updating proposal:", error);
          return new Response(JSON.stringify({ error: "Failed to update proposal" }), {
            status: 500,
          });
        }

        console.log(`Proposal ${proposalId} marked as paid via Stripe`);

        // Auto-create commission_payment if proposal has an agency
        const { data: proposal } = await supabaseAdmin
          .from("proposals")
          .select("agency_id, total_price")
          .eq("id", proposalId)
          .maybeSingle();

        if (proposal?.agency_id && proposal?.total_price) {
          // Get agency commission config
          const { data: agency } = await supabaseAdmin
            .from("partner_agencies")
            .select("commission_rate, stripe_fee_bearer")
            .eq("id", proposal.agency_id)
            .maybeSingle();

          const grossAmount = proposal.total_price;
          const commissionRate = agency?.commission_rate ?? 10;
          const stripeFee = Math.round((grossAmount * 3.49 / 100 + 0.39) * 100) / 100;
          const guataCommission = Math.round(grossAmount * commissionRate / 100 * 100) / 100;

          let partnerStripeFee = 0;
          if (agency?.stripe_fee_bearer === 'partner') {
            partnerStripeFee = stripeFee;
          } else if (agency?.stripe_fee_bearer === 'split') {
            partnerStripeFee = Math.round(stripeFee / 2 * 100) / 100;
          }

          const partnerAmount = Math.round((grossAmount - guataCommission - partnerStripeFee) * 100) / 100;

          const { error: commError } = await supabaseAdmin
            .from("commission_payments")
            .insert({
              agency_id: proposal.agency_id,
              proposal_id: proposalId,
              gross_amount: grossAmount,
              stripe_fee: stripeFee,
              guata_commission: guataCommission,
              partner_amount: partnerAmount,
              status: "pending",
            });

          if (commError) {
            console.error("Error creating commission payment:", commError);
          } else {
            console.log(`Commission payment created for proposal ${proposalId}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
