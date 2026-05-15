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

    // Build conversation history + resolve customer name from conversation
    let history: { role: string; content: string }[] = [];
    let resolvedCustomerName = body.customerName;
    if (conversationId) {
      const { data: conv } = await admin.from("conversations").select("customer_name").eq("id", conversationId).maybeSingle();
      if (conv?.customer_name && !resolvedCustomerName) resolvedCustomerName = conv.customer_name;
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

    // Pull store's own products from DB (preferred over Shopify)
    let catalogContext = "";
    const { data: ownProducts } = await admin
      .from("products")
      .select("name, description, price, stock, category, sku")
      .eq("user_id", ownerId)
      .eq("status", "active")
      .gt("stock", 0)
      .limit(50);
    if (ownProducts && ownProducts.length) {
      catalogContext = ownProducts
        .map((p: any) => `- ${p.name}${p.category ? ` [${p.category}]` : ""} | ฿${p.price} | สต็อก ${p.stock} ชิ้น${p.sku ? ` | SKU:${p.sku}` : ""} — ${(p.description || "").slice(0, 120)}`)
        .join("\n");
    }

    // Pull this customer's purchase history from orders (match by name)
    let purchaseHistory = "";
    if (resolvedCustomerName) {
      const { data: orders } = await admin
        .from("orders")
        .select("product_name, amount, channel, created_at")
        .eq("user_id", ownerId)
        .ilike("customer_name", resolvedCustomerName)
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

${purchaseHistory ? `PURCHASE HISTORY ของลูกค้าคนนี้ (${resolvedCustomerName}) — ใช้แนะนำสินค้าเสริม/อัพเกรด:\n${purchaseHistory}\n` : ""}
KNOWLEDGE BASE:
${trainingContext || "(no training documents yet)"}

Rules:
- Keep replies under 4 short sentences when possible.
- เมื่อลูกค้าถามถึงสินค้า ให้แนะนำ 2-3 รายการจาก LIVE PRODUCT CATALOG พร้อมราคา (อย่าแต่งราคาเอง)
- ถ้ามี PURCHASE HISTORY ให้แนะนำสินค้าเสริม/อัพเกรดที่เข้ากันกับสิ่งที่เคยซื้อ
- Always end sales-intent replies with a clear next step (e.g. "ต้องการสั่งเลยไหมคะ?").
- Never invent prices, stock, or order numbers.

ORDER CONFIRMATION PROTOCOL (สำคัญมาก):
- เมื่อลูกค้ายืนยันการสั่งซื้อชัดเจน (เช่น "สั่งเลย", "เอาอันนี้", "ยืนยัน", "order it", "I'll take it") ให้ตอบยืนยันสั้นๆ แล้วต่อท้ายด้วย marker นี้ (อย่าให้ลูกค้าเห็น เราจะลบทิ้งก่อนแสดงผล):
  <<ORDER:ชื่อสินค้าตรงตาม CATALOG|จำนวน>>
- ตัวอย่าง: "รับทราบค่ะ จัดส่ง iPhone 15 Pro 256GB ให้นะคะ <<ORDER:iPhone 15 Pro 256GB|1>>"
- ใส่ marker เฉพาะตอนที่ลูกค้ายืนยันแน่นอน ห้ามใส่ตอนแค่ถามข้อมูล`;

    // Save customer message if we have a conversation
    if (conversationId) {
      await admin.from("messages").insert({
        conversation_id: conversationId,
        user_id: ownerId,
        sender: "customer",
        content: userMessageContent,
      });
      // Detect human-takeover request
      const lower = userMessageContent.toLowerCase();
      const wantsHuman = /(คุยกับ(เจ้าหน้าที่|พนักงาน|แอดมิน|คน)|ขอ(เจ้าหน้าที่|แอดมิน|คน)|ติดต่อ(เจ้าหน้าที่|พนักงาน)|talk to (a )?(human|agent|staff|person)|speak to (a )?(human|agent))/i.test(lower);
      const convUpdate: any = { last_message: userMessageContent, last_message_at: new Date().toISOString() };
      if (wantsHuman) convUpdate.status = "human_takeover";
      await admin.from("conversations").update(convUpdate).eq("id", conversationId);
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
    const rawReply: string = aiJson.choices?.[0]?.message?.content?.trim() || "ขออภัยค่ะ ดิฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้";

    // Parse <<ORDER:name|qty>> markers → decrement stock + create order
    let reply = rawReply;
    const orderRegex = /<<ORDER:([^|>]+)\|(\d+)>>/g;
    const orderMatches = [...rawReply.matchAll(orderRegex)];
    if (orderMatches.length) {
      reply = rawReply.replace(orderRegex, "").trim();
      for (const m of orderMatches) {
        const productName = m[1].trim();
        const qty = parseInt(m[2], 10) || 1;
        const { data: prod } = await admin
          .from("products")
          .select("id, name, price, stock")
          .eq("user_id", ownerId)
          .ilike("name", productName)
          .maybeSingle();
        if (prod && prod.stock >= qty) {
          await admin.from("products").update({ stock: prod.stock - qty }).eq("id", prod.id);
          await admin.from("orders").insert({
            user_id: ownerId,
            order_number: "#A-" + Math.floor(10000 + Math.random() * 90000),
            customer_name: resolvedCustomerName || body.customerName || "Customer",
            product_name: prod.name,
            amount: Number(prod.price) * qty,
            closed_by_ai: true,
            channel: (body.channel as any) || "web_widget",
          });
        } else if (prod) {
          reply += `\n\n(แจ้ง: สต็อก ${prod.name} ไม่พอค่ะ เหลือ ${prod.stock} ชิ้น)`;
        }
      }
    }

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
