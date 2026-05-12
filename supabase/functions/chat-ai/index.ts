// AI chat edge function - generates AI replies using Lovable AI Gateway
// Uses training documents + bot features as context, saves to messages table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReqBody {
  conversationId?: string;
  customerName?: string;
  channel?: string;
  message: string;
  ownerId?: string; // for public widget mode
  history?: { role: "user" | "assistant"; content: string }[];
  saveToDb?: boolean; // default true if conversationId set
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.message?.trim()) {
      return json({ error: "message required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve owner: either authenticated user or explicit ownerId (widget mode)
    let ownerId = body.ownerId;
    let conversationId = body.conversationId;
    let userMessageContent = body.message;

    const authHeader = req.headers.get("Authorization");
    if (!ownerId && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser(token);
      if (data?.user) ownerId = data.user.id;
    }
    if (!ownerId) return json({ error: "owner not resolved" }, 401);

    // Pull training documents (limit to small context)
    const { data: docs } = await admin
      .from("training_documents")
      .select("title, doc_type, content")
      .eq("user_id", ownerId)
      .limit(20);

    // Pull profile/company name
    const { data: profile } = await admin.from("profiles").select("full_name, company_name").eq("id", ownerId).maybeSingle();

    // Build conversation history
    let history: { role: string; content: string }[] = [];
    if (conversationId) {
      const { data: prev } = await admin
        .from("messages")
        .select("sender, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(30);
      history = (prev || []).map((m: any) => ({
        role: m.sender === "customer" ? "user" : "assistant",
        content: m.content,
      }));
    } else if (body.history) {
      history = body.history.map((h) => ({ role: h.role, content: h.content }));
    }

    const trainingContext = (docs || [])
      .map((d: any) => `### ${d.title} (${d.doc_type})\n${d.content || "(no inline content)"}`)
      .join("\n\n")
      .slice(0, 6000);

    // Pull live Shopify catalog (best-effort)
    let catalogContext = "";
    try {
      const SHOP = "ai-commerce-partner-4o3co.myshopify.com";
      const TOKEN = "f7f2c827b5fddb8d99c0ae214a909d51";
      const r = await fetch(`https://${SHOP}/api/2025-07/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": TOKEN },
        body: JSON.stringify({
          query: `{ products(first: 30) { edges { node { title vendor productType description priceRange { minVariantPrice { amount currencyCode } } variants(first:3){ edges{ node{ availableForSale } } } } } } }`,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const items = (j?.data?.products?.edges || []).map((e: any) => {
          const n = e.node;
          const price = `${n.priceRange.minVariantPrice.amount} ${n.priceRange.minVariantPrice.currencyCode}`;
          const inStock = n.variants.edges.some((v: any) => v.node.availableForSale);
          return `- ${n.title} | ${n.vendor} | ${n.productType} | ${price} | ${inStock ? "มีสต็อก" : "หมด"} — ${(n.description || "").slice(0, 120)}`;
        });
        if (items.length) catalogContext = items.join("\n");
      }
    } catch (e) {
      console.warn("shopify fetch failed", e);
    }

    // Pull this customer's purchase history from orders (match by name)
    let purchaseHistory = "";
    if (body.customerName) {
      const { data: orders } = await admin
        .from("orders")
        .select("product_name, amount, channel, created_at")
        .eq("user_id", ownerId)
        .ilike("customer_name", body.customerName)
        .order("created_at", { ascending: false })
        .limit(10);
      if (orders && orders.length) {
        purchaseHistory = orders
          .map((o: any) => `- ${o.product_name} (${o.amount} บาท, ${o.channel || "-"})`)
          .join("\n");
      }
    }

    const systemPrompt = `You are an expert AI Sales & Customer Service agent for ${profile?.company_name || "this online store"}.
Your goals: greet warmly, answer product questions, RECOMMEND products from the live catalog based on the customer's intent and purchase history, close sales, handle warranty/returns, and escalate to human when needed.
Tone: friendly, helpful, concise. Match the customer's language (Thai or English) automatically.

LIVE PRODUCT CATALOG (ใช้ข้อมูลนี้ในการแนะนำ — อย่าแต่งราคา/สต็อก):
${catalogContext || "(no catalog available)"}

${purchaseHistory ? `PURCHASE HISTORY ของลูกค้าคนนี้ (${body.customerName}) — ใช้แนะนำสินค้าเสริม/อัพเกรด:\n${purchaseHistory}\n` : ""}
KNOWLEDGE BASE:
${trainingContext || "(no training documents yet)"}

Rules:
- Keep replies under 4 short sentences when possible.
- เมื่อลูกค้าถามถึงสินค้า ให้แนะนำ 2-3 รายการจาก LIVE PRODUCT CATALOG พร้อมราคา (อย่าแต่งราคาเอง)
- ถ้ามี PURCHASE HISTORY ให้แนะนำสินค้าเสริม/อัพเกรดที่เข้ากันกับสิ่งที่เคยซื้อ
- Always end sales-intent replies with a clear next step (e.g. "ต้องการสั่งเลยไหมคะ?").
- Never invent prices, stock, or order numbers.`;

    // Save customer message if we have a conversation
    if (conversationId) {
      await admin.from("messages").insert({
        conversation_id: conversationId,
        user_id: ownerId,
        sender: "customer",
        content: userMessageContent,
      });
      await admin
        .from("conversations")
        .update({ last_message: userMessageContent, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else if (body.saveToDb !== false && body.customerName) {
      // Create conversation (widget mode)
      const { data: conv } = await admin
        .from("conversations")
        .insert({
          user_id: ownerId,
          customer_name: body.customerName,
          channel: (body.channel as any) || "web_widget",
          last_message: userMessageContent,
        })
        .select()
        .single();
      if (conv) {
        conversationId = conv.id;
        await admin.from("messages").insert({
          conversation_id: conv.id,
          user_id: ownerId,
          sender: "customer",
          content: userMessageContent,
        });
      }
    }

    // Call Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessageContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      if (aiRes.status === 429) return json({ error: "Rate limit exceeded, please try again." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted. Please add funds in workspace settings." }, 402);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiJson = await aiRes.json();
    const reply: string = aiJson.choices?.[0]?.message?.content?.trim() || "ขออภัยค่ะ ดิฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้";

    // Save AI reply
    if (conversationId) {
      await admin.from("messages").insert({
        conversation_id: conversationId,
        user_id: ownerId,
        sender: "ai",
        content: reply,
      });
      await admin
        .from("conversations")
        .update({ last_message: reply, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return json({ reply, conversationId });
  } catch (e) {
    console.error("chat-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
