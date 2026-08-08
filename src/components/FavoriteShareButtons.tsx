import { useEffect, useState } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { cn } from "./ui/cn";

const STORAGE_KEY = "dealer-dms-favorites";

function readFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function FavoriteButton({ slug }: { slug: string }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => setIsFavorite(readFavorites().includes(slug)), [slug]);

  function toggle() {
    const current = readFavorites();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFavorite(!isFavorite);
  }

  return (
    <button onClick={toggle} aria-pressed={isFavorite} className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-steel)] px-4 py-2.5 text-sm">
      <Heart size={16} className={cn(isFavorite && "fill-[var(--color-status-sold)] text-[var(--color-status-sold)]")} />
      {isFavorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}
    </button>
  );
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleShare} className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-steel)] px-4 py-2.5 text-sm">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "הקישור הועתק" : "שיתוף"}
    </button>
  );
}
