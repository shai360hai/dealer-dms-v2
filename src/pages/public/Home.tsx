import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Search } from "lucide-react";
import { Button, Input, VehicleCard } from "../../components/ui";
import { InquiryForm } from "../../components/InquiryForm";
import { useVehicles } from "../../hooks/useVehicles";

const WHY_US = [
  { title: "מפרט מלא לכל רכב", body: "קילומטראז׳, בעלים קודמים, היסטוריית טיפולים ואחריות — לפני שהגעתם, לא אחרי." },
  { title: "תמונות אמיתיות בלבד", body: "כל תמונה צולמה של הרכב הספציפי שאתם רואים, לא תמונות קטלוג." },
  { title: "נסיעת מבחן בתיאום מראש", body: "משאירים פרטים לרכב שמעניין אתכם, וחוזרים אליכם באותו היום." },
  { title: "ליווי גם אחרי הקנייה", body: "אחריות יצרן מלאה ותמיכה שוטפת גם אחרי שהרכב יצא מהחניה." },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: featured } = useVehicles({ publishedOnly: true, sort: "newest", pageSize: 4 });
  const { data: latest } = useVehicles({ publishedOnly: true, sort: "newest", pageSize: 8 });

  return (
    <div>
      <section className="relative overflow-hidden bg-[var(--color-ink)] py-20 text-center text-[var(--color-porcelain)] sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, var(--color-chrome-gold) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--color-navy-light) 0%, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-chrome-gold)]">המלאי הזמין עכשיו</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">הרכב הבא שלכם מחכה כאן</h1>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-steel)]">מפרט מלא, תמונות אמיתיות ומחיר שקוף לכל רכב במלאי — לפני שקבעתם הגעה.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(q ? `/inventory?q=${encodeURIComponent(q)}` : "/inventory");
            }}
            className="mx-auto mt-8 flex max-w-xl gap-2"
          >
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי יצרן או דגם, למשל Deepal S07" className="h-12 bg-white/95 text-[var(--color-ink)]" />
            <Button type="submit" variant="gold" size="lg">
              <Search size={18} /> חיפוש
            </Button>
          </form>
          <Link to="/inventory" className="mt-4 inline-block text-sm text-[var(--color-chrome-gold-soft)] underline underline-offset-4">
            צפייה בכל המלאי
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">רכבים מומלצים</h2>
          <Link to="/inventory" className="text-sm text-[var(--color-navy)] underline">לכל המלאי</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured?.items.map((v) => (
            <VehicleCard key={v.id} vehicle={v} coverImage={v.vehicle_images.find((i) => i.is_cover) ?? v.vehicle_images[0]} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl">התווספו לאחרונה</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest?.items.map((v) => (
            <VehicleCard key={v.id} vehicle={v} coverImage={v.vehicle_images.find((i) => i.is_cover) ?? v.vehicle_images[0]} />
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-porcelain-dim)] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-2xl">למה לקנות אצלנו</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item, i) => (
              <div key={i} className="rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-5">
                <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-chrome-gold)]">0{i + 1}</p>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-steel-dark)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-14 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">יש שאלה על רכב מסוים?</h2>
        <p className="mt-2 text-sm text-[var(--color-steel-dark)]">השאירו פרטים ונחזור אליכם בהקדם — גם אם עדיין לא בחרתם דגם.</p>
        <div className="mt-6 text-start">
          <InquiryForm />
        </div>
      </section>
    </div>
  );
}
