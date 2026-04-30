// Facebook Messenger / Instagram webhook handler.
// Setup: store PAGE_ACCESS_TOKEN + VERIFY_TOKEN per user in integrations.config
// Verify URL: https://<project>.functions.supabase.co/meta-webhook?owner=<userId>&verify=<verify_token>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const ownerId = url.searchParams.get("owner");
  if (!ownerId) return new Response("owner required", { status: 400 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // GET = Meta verification handshake
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const { data: integ } = await admin
      .from("integrations")
      .select("config")
      .eq("user_id", ownerId)
      .in("provider", ["messenger", "instagram"])
      .maybeSingle();
    const verifyToken = (integ?.config as any)?.verify_token;
    if (mode === "subscribe" && token && token === verifyToken) {
      return new Response(challenge || "ok");
    }
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const platform = body.object === "instagram" ? "instagram" : "messenger";

    const { data: integ } = await admin
      .from("integrations")
      .select("config")
      .eq("user_id", ownerId)
      .eq("provider", platform)
      .maybeSingle();

    const pageToken = (integ?.config as any)?.page_access_token as string | undefined;
    if (!pageToken) {
      console.warn(`No page_access_token for ${platform}`, ownerId);
      return new Response("ok");
    }

    for (const entry of body.entry || []) {
      for (const messaging of entry.messaging || []) {
        const senderId: string = messaging.sender?.id;
        const text: string | undefined = messaging.message?.text;
        if (!senderId || !text) continue;

        // Find or create conversation
        let { data: conv } = await admin
          .from("conversations")
          .select("id")
          .eq("user_id", ownerId)
          .eq("channel", platform as any)
          .eq("external_id", senderId)
          .maybeSingle();

        if (!conv) {
          const ins = await admin
            .from("conversations")
            .insert({
              user_id: ownerId,
              customer_name: `${platform === "instagram" ? "IG" : "FB"} ${senderId.slice(0, 6)}`,
              channel: platform as any,
              external_id: senderId,
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
          body: JSON.stringify({ ownerId, conversationId: conv.id, message: text, channel: platform }),
        });
        const aiJson = await aiRes.json();
        const reply: string = aiJson.reply || "ขออภัยค่ะ";

        // Send back via Graph API
        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: reply },
            messaging_type: "RESPONSE",
          }),
        });
      }
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    console.error("meta-webhook error", e);
    return new Response("ok");
  }
});
