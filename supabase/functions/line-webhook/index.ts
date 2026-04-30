// LINE OA webhook handler. Receives messages from LINE, sends to AI, replies via LINE Messaging API.
// Setup: store CHANNEL_ACCESS_TOKEN per user in integrations.config (JSON: { access_token, channel_secret })
// Webhook URL to give to LINE: https://<project>.functions.supabase.co/line-webhook?owner=<userId>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("owner");
    if (!ownerId) return new Response("owner required", { status: 400 });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Lookup integration config
    const { data: integ } = await admin
      .from("integrations")
      .select("config, status")
      .eq("user_id", ownerId)
      .eq("provider", "line_oa")
      .maybeSingle();

    const accessToken = (integ?.config as any)?.access_token as string | undefined;
    if (!accessToken) {
      console.warn("No LINE access_token configured for owner", ownerId);
      return new Response("ok"); // ack so LINE doesn't retry
    }

    const body = await req.json();
    const events = body.events || [];

    for (const ev of events) {
      if (ev.type !== "message" || ev.message?.type !== "text") continue;
      const text: string = ev.message.text;
      const lineUserId: string = ev.source?.userId || ev.source?.groupId || "unknown";
      const replyToken: string | undefined = ev.replyToken;

      // Find or create conversation
      let { data: conv } = await admin
        .from("conversations")
        .select("id")
        .eq("user_id", ownerId)
        .eq("channel", "line_oa")
        .eq("external_id", lineUserId)
        .maybeSingle();

      if (!conv) {
        const ins = await admin
          .from("conversations")
          .insert({
            user_id: ownerId,
            customer_name: `LINE ${lineUserId.slice(0, 6)}`,
            channel: "line_oa",
            external_id: lineUserId,
            last_message: text,
          })
          .select("id")
          .single();
        conv = ins.data!;
      }

      // Call AI
      const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/chat-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          conversationId: conv.id,
          message: text,
          channel: "line_oa",
        }),
      });
      const aiJson = await aiRes.json();
      const reply: string = aiJson.reply || "ขออภัยค่ะ ดิฉันไม่สามารถตอบได้ในขณะนี้";

      // Reply via LINE
      if (replyToken) {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: "text", text: reply }],
          }),
        });
      }
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    console.error("line-webhook error", e);
    return new Response("ok"); // always ack to avoid LINE retries
  }
});
