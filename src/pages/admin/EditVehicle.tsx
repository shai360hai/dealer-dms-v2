import { useState } from "react";
import { useParams } from "react-router";
import { VehicleForm } from "../../components/VehicleForm";
import { ImageManager } from "../../components/ImageManager";
import { useVehicle, useUpdateVehicle } from "../../hooks/useVehicles";
import { useSaveAngleImages } from "../../hooks/useSaveAngleImages";
import type { VehicleFormInput } from "../../lib/schemas";
import type { AngleUrls } from "../../lib/angles";

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading } = useVehicle(id);
  const updateVehicle = useUpdateVehicle(id!);
  const saveAngles = useSaveAngleImages(id!);
  const [saved, setSaved] = useState(false);
  const [rejected, setRejected] = useState<{ label: string; reason: string }[]>([]);

  function handleSubmit(values: VehicleFormInput, angleUrls: AngleUrls) {
    setSaved(false);
    setRejected([]);
    updateVehicle.mutate(values, {
      onSuccess: () => {
        saveAngles.mutate(angleUrls, {
          onSuccess: (r) => {
            setRejected(r.rejected);
            setSaved(true);
          },
          onError: () => setSaved(true),
        });
      },
    });
  }

  if (isLoading || !vehicle) {
    return <p className="text-sm text-[var(--color-steel-dark)]">טוען...</p>;
  }

  // Pre-fill the angle fields from photos already saved for this car.
  const defaultAngleUrls: AngleUrls = {};
  for (const img of vehicle.vehicle_images) {
    if (img.angle) defaultAngleUrls[img.angle as keyof AngleUrls] = img.url;
  }

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl">
        עריכת רכב — {vehicle.brand} {vehicle.model}
      </h1>

      <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-4">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg">תמונות נוספות</h2>
        <p className="mb-3 text-xs text-[var(--color-steel-dark)]">
          תמונות שמועלות כאן מתווספות אחרי חמש תמונות הזוויות שבטופס למטה.
        </p>
        <ImageManager vehicleId={vehicle.id} images={vehicle.vehicle_images} />
      </div>

      {saved && (
        <p className="mb-4 rounded-[var(--radius-card)] bg-[var(--color-status-available)]/10 px-3 py-2 text-sm text-[var(--color-status-available)]">
          הרכב נשמר בהצלחה
        </p>
      )}

      {rejected.length > 0 && (
        <div className="mb-4 rounded-[var(--radius-card)] bg-[color-mix(in_srgb,var(--color-status-reserved)_12%,white)] px-3 py-2 text-sm text-[var(--color-status-reserved)]">
          <p className="font-medium">חלק מהקישורים לא נשמרו:</p>
          <ul className="mt-1 list-inside list-disc">
            {rejected.map((r, i) => (
              <li key={i}>{r.label}: {r.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <VehicleForm
        defaultValues={vehicle}
        defaultAngleUrls={defaultAngleUrls}
        onSubmit={handleSubmit}
        isSubmitting={updateVehicle.isPending || saveAngles.isPending}
      />
    </div>
  );
}
