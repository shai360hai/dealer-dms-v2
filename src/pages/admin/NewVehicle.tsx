import { useState } from "react";
import { useNavigate } from "react-router";
import { VehicleForm } from "../../components/VehicleForm";
import { useCreateVehicle } from "../../hooks/useVehicles";
import { saveAngleImages } from "../../lib/save-angle-images";
import type { VehicleFormInput } from "../../lib/schemas";
import type { AngleUrls } from "../../lib/angles";

export default function NewVehicle() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [error, setError] = useState<string | null>(null);
  const [savingPhotos, setSavingPhotos] = useState(false);

  function handleSubmit(values: VehicleFormInput, angleUrls: AngleUrls) {
    setError(null);
    createVehicle.mutate(values, {
      onSuccess: async (vehicle) => {
        const hasAngles = Object.values(angleUrls).some((u) => (u ?? "").trim());
        if (hasAngles) {
          setSavingPhotos(true);
          try {
            // The vehicle has to exist before its photos can reference
            // it, so this runs only once the insert has returned an id.
            await saveAngleImages(vehicle.id, angleUrls);
          } catch {
            // The vehicle itself saved fine — a photo problem shouldn't
            // strand the user here; it's fixable on the edit screen.
          } finally {
            setSavingPhotos(false);
          }
        }
        navigate(`/admin/vehicles/${vehicle.id}/edit`);
      },
      onError: (err) => setError(err instanceof Error ? err.message : "אירעה שגיאה"),
    });
  }

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl">הוספת רכב</h1>
      {error && (
        <p className="mb-4 rounded-[var(--radius-card)] bg-[var(--color-status-sold)]/10 px-3 py-2 text-sm text-[var(--color-status-sold)]">
          {error}
        </p>
      )}
      <VehicleForm onSubmit={handleSubmit} isSubmitting={createVehicle.isPending || savingPhotos} />
    </div>
  );
}
