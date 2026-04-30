import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchShopifyProducts, ShopifyProduct, SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/integrations/shopify/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, RefreshCw, ExternalLink, Sparkles, Loader2 } from "lucide-react";

export default function ShopifyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchShopifyProducts(50);
      setProducts(list);
    } catch (e: any) {
      toast.error("โหลดสินค้าไม่ได้: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const syncToAI = async () => {
    if (!user || products.length === 0) return;
    setSyncing(true);
    try {
      // Build a single training document containing the catalog
      const content = products
        .map((p) => {
          const n = p.node;
          const price = `${n.priceRange.minVariantPrice.amount} ${n.priceRange.minVariantPrice.currencyCode}`;
          const variants = n.variants.edges
            .map(
              (v) =>
                `  - ${v.node.title} | ${v.node.price.amount} ${v.node.price.currencyCode}` +
                (v.node.availableForSale ? "" : " (out of stock)"),
            )
            .join("\n");
          return `## ${n.title}\nVendor: ${n.vendor}\nType: ${n.productType}\nPrice from: ${price}\n${n.description}\nVariants:\n${variants}`;
        })
        .join("\n\n");

      // Remove old catalog doc, then insert new
      await supabase
        .from("training_documents")
        .delete()
        .eq("user_id", user.id)
        .eq("doc_type", "shopify_catalog");

      const { error } = await supabase.from("training_documents").insert({
        user_id: user.id,
        doc_type: "shopify_catalog",
        title: "Shopify Catalog (auto-synced)",
        content,
        status: "ready",
      });

      if (error) throw error;

      // Mark Shopify integration as connected
      await supabase.from("integrations").upsert(
        {
          user_id: user.id,
          provider: "shopify",
          status: "connected",
          store_name: SHOPIFY_STORE_PERMANENT_DOMAIN,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );

      toast.success(`Sync สำเร็จ! AI Bot จะใช้สินค้า ${products.length} รายการในการตอบลูกค้า`);
    } catch (e: any) {
      toast.error("Sync ไม่ได้: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Shopify Products</h1>
          <p className="text-muted-foreground mt-1">
            สินค้าทั้งหมดใน Shopify store ของคุณ — sync เข้า AI Bot เพื่อให้ตอบลูกค้าด้วยข้อมูลจริง
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={syncToAI} disabled={syncing || products.length === 0} className="bg-gradient-primary">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Sync to AI
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-gradient-card border-border/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/15 grid place-items-center">
          <Package className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{SHOPIFY_STORE_PERMANENT_DOMAIN}</div>
          <div className="text-xs text-muted-foreground">{products.length} สินค้าใน store</div>
        </div>
        <a href={`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" /> Shopify Admin
          </Button>
        </a>
      </Card>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground bg-gradient-card border-border/50">กำลังโหลด...</Card>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card border-border/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <div className="font-semibold mb-1">ยังไม่มีสินค้า</div>
          <div className="text-sm text-muted-foreground">เพิ่มสินค้าใน Shopify store ของคุณก่อน</div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const n = p.node;
            const img = n.images.edges[0]?.node?.url;
            const price = parseFloat(n.priceRange.minVariantPrice.amount);
            return (
              <Card key={n.id} className="overflow-hidden bg-gradient-card border-border/50">
                <div className="aspect-square bg-muted/30 grid place-items-center">
                  {img ? <img src={img} alt={n.title} className="w-full h-full object-cover" /> : <Package className="h-12 w-12 text-muted-foreground" />}
                </div>
                <div className="p-4 space-y-2">
                  <Badge variant="outline" className="text-xs">{n.vendor}</Badge>
                  <div className="font-semibold line-clamp-1">{n.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{n.description}</div>
                  <div className="font-display font-bold text-lg text-primary">
                    ฿{price.toLocaleString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
