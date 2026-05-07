
CREATE OR REPLACE FUNCTION public.seed_demo_data_for(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  i int;
  conv_id uuid;
begin
  if uid is null then return; end if;
  if exists (select 1 from public.orders where user_id = uid limit 1) then return; end if;

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

  insert into public.orders(user_id, order_number, customer_name, product_name, amount, closed_by_ai, channel) values
    (uid,'#A-10293','Somchai P.','iPhone 15 Pro 256GB', 42900, true, 'shopify'),
    (uid,'#A-10294','Praew K.','MacBook Air M3', 39900, true, 'line_oa'),
    (uid,'#A-10295','Niran T.','AirPods Pro 2', 8990, true, 'messenger'),
    (uid,'#A-10296','Mali S.','iPad Air', 24900, false, 'web_widget'),
    (uid,'#A-10297','Kris W.','Sony WH-1000XM5', 12900, true, 'shopee'),
    (uid,'#A-10298','Jane D.','Galaxy S24 Ultra', 45900, true, 'lazada'),
    (uid,'#A-10299','Tom R.','Apple Watch Ultra 2', 31900, true, 'instagram');

  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message, unread_count)
    values (uid,'Somchai P.','line_oa','active','hot','สนใจ iPhone 15 Pro มีสีไหนบ้างคะ',2)
    returning id into conv_id;
  insert into public.messages(conversation_id, user_id, sender, content) values
    (conv_id, uid, 'customer','สวัสดีครับ สนใจ iPhone 15 Pro'),
    (conv_id, uid, 'ai','สวัสดีค่ะ iPhone 15 Pro มี 4 สี: Natural, Blue, White, Black Titanium ค่ะ ต้องการความจุเท่าไหร่ดีคะ?'),
    (conv_id, uid, 'customer','256GB ครับ มีสต็อกไหม'),
    (conv_id, uid, 'ai','มีค่ะ ราคา 42,900 บาท + ฟิล์มกระจกแถมฟรี ต้องการสั่งเลยไหมคะ?');

  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message, unread_count)
    values (uid,'Praew K.','messenger','active','warm','ขอเช็คราคา MacBook หน่อยค่ะ',1)
    returning id into conv_id;
  insert into public.messages(conversation_id, user_id, sender, content) values
    (conv_id, uid, 'customer','ขอเช็คราคา MacBook Air M3 หน่อยค่ะ'),
    (conv_id, uid, 'ai','MacBook Air M3 ราคา 39,900 บาทค่ะ มีโปรผ่อน 0% 10 เดือนด้วยนะคะ');

  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message, unread_count)
    values (uid,'Niran T.','shopify','resolved','cold','ขอบคุณครับ',0)
    returning id into conv_id;
  insert into public.messages(conversation_id, user_id, sender, content) values
    (conv_id, uid, 'customer','ของถึงแล้วครับ ขอบคุณ'),
    (conv_id, uid, 'ai','ยินดีค่ะ หากมีคำถามเพิ่มเติมแจ้งได้ตลอดนะคะ');

  insert into public.conversations(user_id, customer_name, channel, status, lead_tag, last_message, unread_count)
    values (uid,'Mali S.','web_widget','human_takeover','hot','ขอคุยกับเจ้าหน้าที่หน่อย',3)
    returning id into conv_id;
  insert into public.messages(conversation_id, user_id, sender, content) values
    (conv_id, uid, 'customer','ขอคุยกับเจ้าหน้าที่หน่อยค่ะ'),
    (conv_id, uid, 'ai','รับทราบค่ะ กำลังโอนสายให้เจ้าหน้าที่นะคะ');

  insert into public.integrations(user_id, provider, status, store_name, connected_at) values
    (uid,'shopify','connected','my-store.myshopify.com', now()),
    (uid,'line_oa','connected','@mybrand', now()),
    (uid,'messenger','disconnected', null, null),
    (uid,'shopee','disconnected', null, null);

  insert into public.training_documents(user_id, doc_type, title) values
    (uid,'pdf','Catalog 2026.pdf'),
    (uid,'excel','Products-Inventory.xlsx'),
    (uid,'faq','คำถามที่พบบ่อย v3'),
    (uid,'tone','Brand Voice Guidelines');
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));

  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  insert into public.subscriptions (user_id, plan) values (new.id, 'free');

  insert into public.bot_features (user_id, feature_key, enabled)
  select new.id, k, true from unnest(enum_range(null::public.bot_feature_key)) as k;

  begin
    perform public.seed_demo_data_for(new.id);
  exception when others then
    raise log 'seed_demo_data_for failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
