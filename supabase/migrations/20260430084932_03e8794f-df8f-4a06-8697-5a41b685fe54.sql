
create or replace function public.seed_demo_data()
returns void language plpgsql security invoker set search_path = public
as $$
declare
  uid uuid := auth.uid();
  i int;
  conv_id uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  -- skip if already seeded
  if exists (select 1 from public.orders where user_id = uid limit 1) then return; end if;

  -- 30 days metrics
  for i in 0..29 loop
    insert into public.daily_metrics(user_id, metric_date, revenue, ai_revenue, chats_count, orders_count, conversion_rate, new_customers, returning_customers, avg_response_seconds, csat)
    values (uid, current_date - i,
      40000 + (random()*60000)::numeric(12,2),
      25000 + (random()*40000)::numeric(12,2),
      80 + (random()*200)::int,
      10 + (random()*40)::int,
      (8 + random()*7)::numeric(5,2),
      (5 + random()*20)::int,
      (10 + random()*30)::int,
      (3 + random()*8)::int,
      (4.2 + random()*0.7)::numeric(3,2)
    ) on conflict do nothing;
  end loop;

  -- orders
  insert into public.orders(user_id, order_number, customer_name, product_name, amount, closed_by_ai, channel) values
    (uid,'#A-10293','Somchai P.','iPhone 15 Pro 256GB', 42900, true, 'shopify'),
    (uid,'#A-10294','Praew K.','MacBook Air M3', 39900, true, 'line_oa'),
    (uid,'#A-10295','Niran T.','AirPods Pro 2', 8990, true, 'messenger'),
    (uid,'#A-10296','Mali S.','iPad Air', 24900, false, 'web_widget'),
    (uid,'#A-10297','Kris W.','Sony WH-1000XM5', 12900, true, 'shopee'),
    (uid,'#A-10298','Jane D.','Galaxy S24 Ultra', 45900, true, 'lazada'),
    (uid,'#A-10299','Tom R.','Apple Watch Ultra 2', 31900, true, 'instagram');

  -- conversations + messages
  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message, unread_count)
    values (uid,'Somchai P.','line_oa','active','hot','สนใจ iPhone 15 Pro มีสีไหนบ้างคะ',2)
    returning id into conv_id;
  insert into public.messages(conversation_id, user_id, sender, content) values
    (conv_id, uid, 'customer','สวัสดีครับ สนใจ iPhone 15 Pro'),
    (conv_id, uid, 'ai','สวัสดีค่ะ iPhone 15 Pro มี 4 สี: Natural, Blue, White, Black Titanium ค่ะ ต้องการความจุเท่าไหร่ดีคะ?'),
    (conv_id, uid, 'customer','256GB ครับ มีสต็อกไหม'),
    (conv_id, uid, 'ai','มีค่ะ ราคา 42,900 บาท + ฟิล์มกระจกแถมฟรี ต้องการสั่งเลยไหมคะ?');

  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message)
    values (uid,'Praew K.','messenger','active','warm','ขอเช็คราคา MacBook หน่อยค่ะ',1);
  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message)
    values (uid,'Niran T.','shopify','resolved','cold','ขอบคุณครับ',0);
  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message)
    values (uid,'Mali S.','web_widget','human_takeover','hot','ขอคุยกับเจ้าหน้าที่หน่อย',3);

  -- integrations (some pre-connected)
  insert into public.integrations(user_id, provider, status, store_name, connected_at) values
    (uid,'shopify','connected','my-store.myshopify.com', now()),
    (uid,'line_oa','connected','@mybrand', now()),
    (uid,'messenger','disconnected', null, null),
    (uid,'shopee','disconnected', null, null);

  -- training docs
  insert into public.training_documents(user_id, doc_type, title) values
    (uid,'pdf','Catalog 2026.pdf'),
    (uid,'excel','Products-Inventory.xlsx'),
    (uid,'faq','คำถามที่พบบ่อย v3'),
    (uid,'tone','Brand Voice Guidelines');
end; $$;

revoke execute on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;
