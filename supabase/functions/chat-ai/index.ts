// AI chat edge function - HARD-CODED TRANSLATION GUARD
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const userMessage = body.message;
    if (!userMessage?.trim()) return json({ error: "message required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Resolve owner
    let ownerId = body.ownerId;
    const authHeader = req.headers.get("Authorization");
    if (!ownerId && authHeader?.startsWith("Bearer ")) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data?.user) ownerId = data.user.id;
    }
    if (!ownerId) return json({ error: "owner not resolved" }, 401);

    // Pull store data
    const [{ data: profile }, { data: products }] = await Promise.all([
      admin.from("profiles").select("company_name").eq("id", ownerId).maybeSingle(),
      admin.from("products").select("name, price").eq("user_id", ownerId).eq("status", "active").limit(10)
    ]);

    // DETECTION: What is the input language?
    const isThai = /[ก-ฮ]/.test(userMessage);
    const targetLang = isThai ? "Thai" : "the SAME language as the user input";

    const systemPrompt = `
[ROLE]
You are a sales assistant for "${profile?.company_name || "this store"}".
[MANDATORY]
Respond ONLY in ${targetLang}. 
If target is NOT Thai, translate all product info below.
[DATA]
${products?.map(p => `- ${p.name}: ฿${p.price}`).join("\n") || "No catalog."}
`;

    // CALL 1: Generate Response
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "google/gemini-1.5-flash", 
        messages: [
          { role: "system", content: systemPrompt },
          ...(body.history || []),
          { role: "user", content: `(Instruction: Use ONLY ${targetLang}): ${userMessage}` }
        ],
        temperature: 0
      }),
    });

    const aiJson = await aiRes.json();
    let rawReply = aiJson.choices?.[0]?.message?.content?.trim() || "";

    // CALL 2: THE TRANSLATION GUARD (If input is not Thai, we FORCE translation again)
    if (!isThai) {
      const transRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "google/gemini-1.5-flash", 
          messages: [
            { role: "system", content: `You are a translator. Translate the following text into the same language as this input: "${userMessage}". Output ONLY the translation.` },
            { role: "user", content: rawReply }
          ],
          temperature: 0
        }),
      });
      const transJson = await transRes.json();
      rawReply = transJson.choices?.[0]?.message?.content?.trim() || rawReply;
    }

    const finalReply = rawReply;

    // Save history
    if (body.conversationId) {
      await admin.from("messages").insert([
        { conversation_id: body.conversationId, user_id: ownerId, sender: "customer", content: userMessage },
        { conversation_id: body.conversationId, user_id: ownerId, sender: "ai", content: finalReply }
      ]);
      await admin.from("conversations").update({ last_message: finalReply, last_message_at: new Date().toISOString() }).eq("id", body.conversationId);
    }

    return json({ reply: finalReply, conversationId: body.conversationId });
  } catch (e) {
    return json({ error: "error" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
