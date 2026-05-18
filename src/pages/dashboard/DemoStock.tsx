import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Edit3, Save, X, ImageIcon } from "lucide-react";

export default function DemoStock() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("demo_stock" as any).select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setImageUrl("");
    setIsAdding(false);
    setEditingId(null);
  };

  const save = async () => {
    if (!user || !name) {
      toast.error("Please enter a product name");
      return;
    }
    const payload = {
      user_id: user.id,
      name: name.trim(),
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 0,
      image_url: imageUrl.trim() || null
    };

    console.log("Saving stock item:", payload);

    try {
      if (editingId) {
        const { error, data } = await supabase.from("demo_stock").update(payload).eq("id", editingId).select();
        if (error) throw error;
        toast.success("Updated successfully");
      } else {
        const { error, data } = await supabase.from("demo_stock").insert([payload]).select();
        if (error) throw error;
        toast.success("Added to stock");
      }
      resetForm();
      load();
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error(e.message || "Failed to save product. Please ensure the SQL was run in Supabase.");
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("demo_stock" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const edit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString());
    setQuantity(item.quantity.toString());
    setImageUrl(item.image_url || "");
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground mt-1">จัดการสต็อกสินค้าเพื่อให้ AI ตรวจสอบจำนวนคงเหลือ</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-gradient-primary">
          {isAdding ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {isAdding ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 bg-gradient-card border-border/50 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-display font-semibold mb-4">{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div><Label>ชื่อสินค้า</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="เช่น เสื้อยืดสีขาว" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ราคา (บาท)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5" placeholder="0" /></div>
                <div><Label>จำนวนในสต็อก</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5" placeholder="0" /></div>
              </div>
            </div>
            <div className="space-y-4">
              <div><Label>รูปภาพ URL (Optional)</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1.5" placeholder="https://..." /></div>
              <div className="pt-6">
                <Button onClick={save} className="w-full bg-primary"><Save className="h-4 w-4 mr-2" />{editingId ? "Update Product" : "Save Product"}</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           <div className="col-span-full py-12 text-center text-muted-foreground">Loading demo stock...</div>
        ) : items.length === 0 ? (
          <Card className="col-span-full p-12 text-center bg-gradient-card border-border/50">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <div className="font-semibold mb-1">ยังไม่มีสินค้าในระบบเดโม่</div>
            <div className="text-sm text-muted-foreground">เริ่มเพิ่มสินค้าเพื่อทดสอบ AI ได้เลย</div>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-gradient-card border-border/50 flex flex-col group">
              <div className="aspect-video bg-muted/30 relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={item.quantity > 0 ? "secondary" : "destructive"}>
                    {item.quantity > 0 ? `Stock: ${item.quantity}` : "Out of Stock"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-bold text-lg mb-1">{item.name}</div>
                <div className="text-primary font-display font-bold text-xl mb-4">฿{item.price.toLocaleString()}</div>
                <div className="flex gap-2 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => edit(item)}><Edit3 className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
