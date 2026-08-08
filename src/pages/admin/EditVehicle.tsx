import { useState } from "react";
import { useParams } from "react-router";
import { VehicleForm } from "../../components/VehicleForm";
import { ImageManager } from "../../components/ImageManager";
import { useVehicle, useUpdateVehicle } from "../../hooks/useVehicles";
import type { VehicleFormInput } from "../../lib/schemas";

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading } = useVehicle(id);
  const updateVehicle = useUpdateVehicle(id!);
  const [saved, setSaved] = useState(false);

  function handleSubmit(values: VehicleFormInput) {
    setSaved(false);
    updateVehicle.mutate(values, { onSuccess: () => setSaved(true) });
  }

  if (isLoading || !vehicle) {
    return <p className="text-sm text-[var(--color-steel-dark)]">טוען...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl">עריכת רכב — {vehicle.brand} {vehicle.model}</h1>

      <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-4">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg">תמונות</h2>
        <ImageManager vehicleId={vehicle.id} images={vehicle.vehicle_images} />
      </div>

      {saved && <p className="mb-4 rounded-[var(--radius-card)] bg-[var(--color-status-available)]/10 px-3 py-2 text-sm text-[var(--color-status-available)]">הרכב נשמר בהצלחה</p>}

      <VehicleForm defaultValues={vehicle} onSubmit={handleSubmit} isSubmitting={updateVehicle.isPending} />
    </div>
  );
}
