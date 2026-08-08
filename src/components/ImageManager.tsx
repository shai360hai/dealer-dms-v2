import { useRef, useState } from "react";
import { UploadCloud, Star, Trash2, Loader2 } from "lucide-react";
import { cn } from "./ui/cn";
import type { VehicleImage } from "../types/database";
import { useUploadVehicleImage, useReorderImages, useSetCoverImage, useDeleteImage } from "../hooks/useImages";

export function ImageManager({ vehicleId, images }: { vehicleId: string; images: VehicleImage[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [queue, setQueue] = useState(0);

  const upload = useUploadVehicleImage(vehicleId);
  const reorder = useReorderImages(vehicleId);
  const setCover = useSetCoverImage(vehicleId);
  const remove = useDeleteImage(vehicleId);

  const sorted = [...images].sort((a, b) => a.order_index - b.order_index);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setQueue((q) => q + list.length);
    for (const file of list) {
      await upload.mutateAsync(file).finally(() => setQueue((q) => q - 1));
    }
  }

  function handleThumbDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...sorted];
    const [moved] = next.splice(dragIndex, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorder.mutate(next.map((img) => img.id));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center text-sm text-[var(--color-steel-dark)] transition-colors",
          isDraggingFile ? "border-[var(--color-chrome-gold)] bg-[var(--color-chrome-gold-soft)]/20" : "border-[var(--color-steel)]",
        )}
      >
        {queue > 0 ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
        <span>{queue > 0 ? "מעלה..." : "גררו תמונות לכאן או לחצו לבחירה"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {sorted.map((img, i) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleThumbDrop(i)}
              className="group relative aspect-square cursor-grab overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-steel)]"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {img.is_cover && (
                <span className="absolute start-1 top-1 rounded-full bg-[var(--color-chrome-gold)] p-1">
                  <Star size={10} fill="currentColor" className="text-[var(--color-ink)]" />
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_cover && (
                  <button type="button" onClick={() => setCover.mutate(img.id)} title="קבע כתמונה ראשית">
                    <Star size={16} className="text-white" />
                  </button>
                )}
                <button type="button" onClick={() => remove.mutate(img)} title="הסרה">
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
