import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">הדף לא נמצא</h1>
      <p className="mt-2 text-[var(--color-steel-dark)]">הקישור שביקשתם אינו קיים.</p>
      <Link to="/" className="mt-6 rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 py-2.5 text-sm text-white">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
