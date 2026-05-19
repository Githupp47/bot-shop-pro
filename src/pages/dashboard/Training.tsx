import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  FileText, 
  FileSpreadsheet, 
  HelpCircle, 
  Globe, 
  Mic, 
  Tag, 
  Plus, 
  Trash2, 
  Eye,
  ExternalLink,
  Info,
  GraduationCap,
  Pencil,
  Upload,
  Loader2,
  FileUp,
  X
} from "lucide-react";

const TYPES = [
  { type: "pdf", icon: FileText, label: "PDF Documents" },
  { type: "excel", icon: FileSpreadsheet, label: "Excel Catalog" },
  { type: "faq", icon: HelpCircle, label: "FAQ" },
  { type: "url", icon: Globe, label: "Website URL" },
  { type: "tone", icon: Mic, label: "Tone of Voice" },
  { type: "promo", icon: Tag, label: "Promotion Rules" },
];

export default function Training() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("faq");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("training_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('training-files')
      .upload(filePath, file);

    if (uploadError) {
      toast.error(`Error uploading file: ${uploadError.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('training-files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const add = async () => {
    if (!user || !title) {
      toast.error("กรุณาระบุหัวข้อข้อมูล");
      return;
    }

    setIsSubmitting(true);
    let uploadedUrl = null;

    if (file) {
      uploadedUrl = await uploadFile(file);
      if (!uploadedUrl) {
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("training_documents").insert({
      user_id: user.id,
      doc_type: type,
      title,
      content,
      url: uploadedUrl,
      status: "ready"
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      return;
    }

    setTitle("");
    setContent("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("เพิ่มข้อมูลการสอนเรียบร้อยแล้ว");
    load();
  };

  const openEdit = (doc: any) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content || "");
    setEditType(doc.doc_type);
    setIsEditDialogOpen(true);
  };

  const update = async () => {
    if (!editingDoc) return;
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from("training_documents")
      .update({
        title: editTitle,
        content: editContent,
        doc_type: editType,
      })
      .eq("id", editingDoc.id);

    setIsSubmitting(false);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      return;
    }

    toast.success("อัปเดตข้อมูลการสอนแล้ว");
    setIsEditDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("training_documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("ไม่สามารถลบข้อมูลได้");
      return;
    }

    toast.success("ลบข้อมูลการสอนแล้ว");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("dash.training")} (System Prompt)</h1>
          <p className="text-muted-foreground mt-1">จัดการคำสอนและข้อมูลเพื่อให้ AI เข้าใจแบรนด์และสินค้าของคุณ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {TYPES.map((item) => (
          <Card
            key={item.type}
            onClick={() => setType(item.type)}
            className={`p-3 cursor-pointer transition-all bg-gradient-card border-border/50 hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-center ${
              type === item.type ? "border-primary shadow-glow ring-1 ring-primary/20 bg-primary/5" : "hover:bg-card/80"
            }`}
          >
            <item.icon className={`h-5 w-5 ${type === item.type ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[11px] font-medium leading-tight ${type === item.type ? "text-primary" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/50 h-fit sticky top-24">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            เพิ่มข้อมูลการสอนใหม่
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">หัวข้อข้อมูล</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
                placeholder="เช่น ข้อมูลแบรนด์, FAQ สินค้า A"
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">แนบไฟล์ (ถ้ามี)</Label>
              <div className="mt-1.5 flex flex-col gap-2">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  ref={fileInputRef}
                  className="hidden"
                  id="training-file-upload"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  {file ? (
                    <>
                      <FileUp className="h-6 w-6 text-primary" />
                      <span className="text-xs font-medium text-primary truncate max-w-full px-2">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">คลิกเพื่ออัปโหลดไฟล์ PDF, Excel หรือรูปภาพ</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">รายละเอียด / คำสั่ง (Instructions)</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="mt-1.5 resize-none"
                placeholder="ใส่รายละเอียดที่ต้องการให้ AI จดจำ หรือคำสั่งเฉพาะเจาะจง..."
              />
            </div>
            
            <Button 
              onClick={add} 
              disabled={isSubmitting}
              className="w-full bg-gradient-primary shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึกข้อมูลการสอน
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground flex gap-2 items-start mt-2">
              <Info className="h-3 w-3 shrink-0 mt-0.5" />
              ข้อมูลที่คุณเพิ่มจะถูกนำไปใช้เป็นบริบท (Context) ในการตอบคำถามของ AI โดยอัตโนมัติ
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 bg-gradient-card border-border/50 min-h-[400px]">
          <h3 className="font-display font-semibold mb-4 text-lg">
            รายการคำสอนทั้งหมด ({docs.length})
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full rounded-lg bg-muted/20 animate-pulse border border-border/40" />
                ))}
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 border-2 border-dashed border-border/40 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">ยังไม่มีข้อมูลการสอน</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    เพิ่มข้อมูลทางด้านซ้ายเพื่อเริ่มเพิ่มความฉลาดให้ AI ของคุณ
                  </p>
                </div>
              </div>
            ) : (
              docs.map((d) => {
                const T = TYPES.find((t) => t.type === d.doc_type) || TYPES[0];
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/40 hover:border-primary/30 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <T.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-2">
                        {d.title}
                        {d.url && <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/30 text-primary">FILE</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] h-4 uppercase tracking-tighter px-1.5 font-bold">
                          {d.doc_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground italic">
                          {new Date(d.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
                          <DialogHeader className="p-6 pb-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <T.icon className="h-6 w-6 text-primary" />
                              </div>
                              <DialogTitle className="text-xl font-bold font-display">
                                {d.title}
                              </DialogTitle>
                            </div>
                            <div className="flex items-center gap-2 border-b border-border pb-4">
                              <Badge variant="outline" className="text-xs uppercase px-2 py-0">
                                {d.doc_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                เพิ่มเมื่อ: {new Date(d.created_at).toLocaleString()}
                              </span>
                            </div>
                          </DialogHeader>
                          
                          <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {d.content && (
                              <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                  เนื้อหาข้อมูล / คำสั่ง
                                </Label>
                                <div className="p-5 rounded-xl bg-muted/30 text-sm leading-relaxed whitespace-pre-wrap border border-border/60 shadow-inner">
                                  {d.content}
                                </div>
                              </div>
                            )}
                            
                            {d.url && (
                              <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                  ลิงก์ไฟล์ หรือ แหล่งที่มา (Source URL)
                                </Label>
                                <a 
                                  href={d.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 rounded-xl bg-primary/5 text-primary text-sm hover:bg-primary/10 transition-colors border border-primary/20 group/link"
                                >
                                  <div className="flex items-center gap-3 truncate mr-4">
                                    <Globe className="h-5 w-5 shrink-0" />
                                    <span className="truncate underline underline-offset-4">{d.url}</span>
                                  </div>
                                  <ExternalLink className="h-4 w-4 shrink-0 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 bg-muted/20 border-t flex justify-end">
                            <Button variant="outline" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                              ปิดหน้าต่าง
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                        onClick={() => openEdit(d)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => {
                          if (confirm("คุณต้องการลบคำสอนนี้ใช่หรือไม่? ข้อมูลนี้จะหายไปจากระบบทันที")) {
                            remove(d.id);
                          }
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลการสอน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>หัวข้อ</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <select 
                  value={editType} 
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>เนื้อหา / คำสั่ง</Label>
              <Textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                rows={10}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>ยกเลิก</Button>
            <Button onClick={update} disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
