import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Menu, X, Car, Phone, MessageCircle, Clock } from "lucide-react";

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "דף הבית" },
    { to: "/inventory", label: "מלאי הרכבים" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--color-steel)] bg-[var(--color-porcelain)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Car size={22} className="text-[var(--color-navy)]" strokeWidth={1.75} />
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy)]">Dealer DMS</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `text-sm transition-colors ${isActive ? "font-medium text-[var(--color-navy)]" : "text-[var(--color-steel-dark)] hover:text-[var(--color-navy)]"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="תפריט">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-[var(--color-steel)] px-4 py-3 md:hidden">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-[var(--radius-card)] px-2 py-2 text-sm hover:bg-[var(--color-porcelain-dim)]">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-[var(--color-steel)] bg-[var(--color-ink)] text-[var(--color-porcelain)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-chrome-gold)]">Dealer DMS</p>
            <p className="mt-2 text-sm text-[var(--color-steel)]">סוכנות רכב מורשית, מלאי חדש ומשומש עם אחריות מלאה.</p>
          </div>
          <div>
            <p className="text-sm font-medium">יצירת קשר</p>
            <div className="mt-2 flex flex-col gap-2 text-sm text-[var(--color-steel)]">
              <a href="tel:+972500000000" className="flex items-center gap-2 hover:text-white" dir="ltr">
                <Phone size={14} /> +972-50-000-0000
              </a>
              <a href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">שעות פעילות</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-steel)]">
              <Clock size={14} /> א׳–ה׳ 9:00–19:00, ו׳ 9:00–13:00
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-[var(--color-steel-dark)]">
          © {new Date().getFullYear()} Dealer DMS — כל הזכויות שמורות
        </div>
      </footer>
    </div>
  );
}
