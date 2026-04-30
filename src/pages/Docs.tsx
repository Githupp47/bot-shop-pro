import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Plug, GraduationCap, Code2, MessageSquare, Rocket, Shield, Zap, BookOpen } from "lucide-react";

const sections = [
  {
    icon: Rocket,
    title: "เริ่มต้นอย่างรวดเร็ว",
    items: [
      ["สมัครบัญชีฟรี", "คลิก Sign up บนหน้าเว็บ ใช้อีเมลหรือ Google · ไม่ต้องใช้บัตรเครดิต"],
      ["เปิด Onboarding", "ในแดชบอร์ด ไปที่ Getting Started จะเจอ checklist 5 ขั้นตอน"],
      ["ทดลองใช้กับ Demo Data", "กดปุ่ม Load demo data ในหน้า Overview เพื่อดูตัวอย่างทันที"],
    ],
  },
  {
    icon: Plug,
    title: "เชื่อมต่อร้านค้า / ช่องทางขาย",
    items: [
      ["Shopify", "ไปที่ Integrations เลือก Shopify → กรอก store URL ระบบจะ sync สินค้าและสต็อกอัตโนมัติ"],
      ["LINE OA", "สร้าง Channel ที่ developers.line.biz → คัดลอก Channel Access Token ใส่ในหน้า Integrations"],
      ["Messenger / Instagram", "เชื่อม Facebook Page ผ่าน Meta App → AI จะตอบใน Messenger/IG DM อัตโนมัติ"],
      ["Lazada / Shopee", "ใช้ OAuth ของ marketplace เพื่อ sync ออเดอร์และตอบ chat"],
    ],
  },
  {
    icon: GraduationCap,
    title: "เทรน AI ให้พูดเหมือนพนักงานร้านคุณ",
    items: [
      ["อัปโหลด PDF Catalog", "AI จะอ่าน catalog และตอบคำถามจากข้อมูลในนั้นทันที"],
      ["อัปโหลด Excel สินค้า", "ราคา, สต็อก, รายละเอียดสินค้า → AI ใช้ตอบลูกค้าและแนะนำสินค้า"],
      ["FAQ และ Brand Voice", "เขียน FAQ และ tone of voice เพื่อให้ AI ตอบสไตล์แบรนด์คุณ"],
      ["URL", "ใส่ลิงก์เว็บไซต์ AI จะ crawl เนื้อหามาเรียนรู้"],
    ],
  },
  {
    icon: Code2,
    title: "ติดตั้ง Web Chat Widget",
    items: [
      ["คัดลอก snippet", "ในหน้า Integrations เลือก Web Widget → คัดลอกโค้ด <script>"],
      ["วางก่อน </body>", "วางบนเว็บไซต์คุณ ลูกค้าจะเห็นปุ่มแชทมุมขวาล่าง"],
      ["ปรับแต่งสี/ตำแหน่ง", "ตั้งค่าใน Bot Features → Widget Appearance"],
    ],
  },
  {
    icon: MessageSquare,
    title: "ใช้งาน Live Chat",
    items: [
      ["ดูทุก conversation", "Live Chat แสดงทุกแชทจากทุก channel รวมในที่เดียว"],
      ["Take over", "ถ้าต้องการคุยเอง กด Take over → AI หยุดตอบทันที"],
      ["Ask AI", "ขอ suggestion จาก AI ตอนคุณเองยังไม่รู้จะตอบยังไง"],
      ["Lead tagging", "Hot/Warm/Cold ระบบจัดให้อัตโนมัติจากความสนใจของลูกค้า"],
    ],
  },
  {
    icon: Zap,
    title: "ฟีเจอร์ AI Bot ที่เปิด/ปิดได้",
    items: [
      ["Sales", "แนะนำสินค้า, cross-sell, upsell, ปิดออเดอร์, recover abandoned cart"],
      ["Customer Service", "ตอบ FAQ, แจ้งสถานะออเดอร์, จัดการเคลม/คืนสินค้า"],
      ["Operations", "เช็คสต็อก, สร้าง order, ออกใบเสร็จ"],
      ["Marketing", "ส่ง broadcast, สร้างโค้ดส่วนลด, segment ลูกค้า"],
    ],
  },
  {
    icon: Shield,
    title: "ความปลอดภัยและข้อมูล",
    items: [
      ["Encryption", "ข้อมูลทุกชิ้นเข้ารหัส end-to-end"],
      ["RLS", "Row-level security ลูกค้าเห็นเฉพาะข้อมูลของตัวเอง"],
      ["PDPA / GDPR", "ปฏิบัติตามกฎหมายความเป็นส่วนตัวสากล"],
    ],
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Documentation</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">วิธีใช้งาน AI Commerce Agent</h1>
          <p className="text-lg text-muted-foreground">ทุกอย่างที่คุณต้องรู้เพื่อเปิดร้านอัจฉริยะของคุณ</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((s) => (
            <Card key={s.title} className="p-6 bg-gradient-card border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-display font-bold text-xl">{s.title}</h2>
              </div>
              <ul className="space-y-3">
                {s.items.map(([t, d]) => (
                  <li key={t}>
                    <div className="font-medium text-sm">{t}</div>
                    <div className="text-sm text-muted-foreground">{d}</div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="mt-10 p-8 bg-gradient-primary text-primary-foreground text-center border-0">
          <h2 className="font-display text-2xl font-bold mb-2">พร้อมเริ่มแล้วใช่ไหม?</h2>
          <p className="opacity-90 mb-4">เปิดบัญชีฟรี เชื่อมร้านค้าได้ภายใน 5 นาที</p>
          <Link to="/auth/signup" className="inline-flex items-center px-6 py-3 rounded-lg bg-background text-foreground font-medium">
            เริ่มฟรีเลย →
          </Link>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
