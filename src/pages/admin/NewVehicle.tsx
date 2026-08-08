import { useState } from "react";
import { useNavigate } from "react-router";
import { VehicleForm } from "../../components/VehicleForm";
import { useCreateVehicle } from "../../hooks/useVehicles";
import type { VehicleFormInput } from "../../lib/schemas";

export default function NewVehicle() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(values: VehicleFormInput) {
    setError(null);
    createVehicle.mutate(values, {
      onSuccess: (vehicle) => navigate(`/admin/vehicles/${vehicle.id}/edit`),
      onError: (err) => setError(err instanceof Error ? err.message : "אירעה שגיאה"),
    });
  }

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl">הוספת רכב</h1>
      {error && <p className="mb-4 rounded-[var(--radius-card)] bg-[var(--color-status-sold)]/10 px-3 py-2 text-sm text-[var(--color-status-sold)]">{error}</p>}
      <VehicleForm onSubmit={handleSubmit} isSubmitting={createVehicle.isPending} />
    </div>
  );
}
