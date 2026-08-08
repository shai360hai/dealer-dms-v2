import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from "./ui";
import { TagInput } from "./TagInput";
import { vehicleFormSchema, type VehicleFormInput, type VehicleFormValues } from "../lib/schemas";
import { VEHICLE_ANGLES, type AngleUrls } from "../lib/angles";
import type { Vehicle } from "../types/database";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--color-status-sold)]">{error}</p>}
    </div>
  );
}

const selectClass = "h-10 w-full rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white px-3 text-sm";

export function VehicleForm({
  defaultValues,
  defaultAngleUrls,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<Vehicle>;
  defaultAngleUrls?: AngleUrls;
  /** Angle photo links are handled outside the Zod schema — they're
   *  rows in vehicle_images, not columns on vehicles. */
  onSubmit: (values: VehicleFormInput, angleUrls: AngleUrls) => void;
  isSubmitting: boolean;
}) {
  const [angleUrls, setAngleUrls] = useState<AngleUrls>(defaultAngleUrls ?? {});
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues, unknown, VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      status: "available",
      published: false,
      owners: 1,
      features: [],
      safety_features: [],
      fuel_type: "petrol",
      transmission: "automatic",
      drive_type: "fwd",
      ...defaultValues,
      trim: defaultValues?.trim ?? "",
      vin: defaultValues?.vin ?? "",
      engine: defaultValues?.engine ?? "",
      battery_capacity: defaultValues?.battery_capacity ?? "",
      description: defaultValues?.description ?? "",
      warranty: defaultValues?.warranty ?? "",
      service_history: defaultValues?.service_history ?? "",
      dealer_notes: defaultValues?.dealer_notes ?? "",
      location: defaultValues?.location ?? "",
      horsepower: defaultValues?.horsepower ?? undefined,
      driving_range: defaultValues?.driving_range ?? undefined,
    } as Partial<VehicleFormValues>,
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values, angleUrls))} className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>פרטים כלליים</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="יצרן" error={errors.brand?.message}><Input {...register("brand")} /></Field>
          <Field label="דגם" error={errors.model?.message}><Input {...register("model")} /></Field>
          <Field label="רמת גימור"><Input {...register("trim")} /></Field>
          <Field label="שנה" error={errors.year?.message}><Input type="number" {...register("year")} /></Field>
          <Field label="מחיר" error={errors.price?.message}><Input type="number" step="1" {...register("price")} /></Field>
          <Field label="מספר מלאי" error={errors.stock_number?.message}><Input {...register("stock_number")} /></Field>
          <Field label="מספר שילדה (VIN)"><Input {...register("vin")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>מפרט טכני</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="קילומטראז׳" error={errors.mileage?.message}><Input type="number" {...register("mileage")} /></Field>
          <Field label="מנוע"><Input {...register("engine")} /></Field>
          <Field label="כוח סוס"><Input type="number" {...register("horsepower")} /></Field>
          <Field label="קיבולת סוללה"><Input placeholder="80 kWh" {...register("battery_capacity")} /></Field>
          <Field label='טווח נסיעה (ק"מ)'><Input type="number" {...register("driving_range")} /></Field>
          <Field label="סוג דלק">
            <select {...register("fuel_type")} className={selectClass}>
              <option value="petrol">בנזין</option>
              <option value="diesel">דיזל</option>
              <option value="hybrid">היברידי</option>
              <option value="plugin_hybrid">נטען (Plug-in)</option>
              <option value="electric">חשמלי</option>
            </select>
          </Field>
          <Field label="תיבת הילוכים">
            <select {...register("transmission")} className={selectClass}>
              <option value="manual">ידני</option>
              <option value="automatic">אוטומטי</option>
              <option value="cvt">CVT</option>
              <option value="dct">DCT</option>
            </select>
          </Field>
          <Field label="הנעה">
            <select {...register("drive_type")} className={selectClass}>
              <option value="fwd">הנעה קדמית</option>
              <option value="rwd">הנעה אחורית</option>
              <option value="awd">הנעה כפולה (AWD)</option>
              <option value="four_wd">4X4</option>
            </select>
          </Field>
          <Field label="מספר בעלים"><Input type="number" {...register("owners")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>מראה חיצוני</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="צבע חיצוני" error={errors.exterior_color?.message}><Input {...register("exterior_color")} /></Field>
          <Field label="צבע פנים" error={errors.interior_color?.message}><Input {...register("interior_color")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>מידע נוסף</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <Field label="תיאור">
            <textarea {...register("description")} rows={4} dir="rtl" className="w-full rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-3 text-sm" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="תוספות ואבזור">
              <Controller control={control} name="features" render={({ field }) => <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="הקלד תכונה ולחץ Enter" />} />
            </Field>
            <Field label="מערכות בטיחות">
              <Controller control={control} name="safety_features" render={({ field }) => <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="הקלד תכונה ולחץ Enter" />} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="אחריות"><Input {...register("warranty")} /></Field>
            <Field label="מיקום הרכב"><Input {...register("location")} /></Field>
          </div>
          <Field label="היסטוריית טיפולים">
            <textarea {...register("service_history")} rows={2} dir="rtl" className="w-full rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-3 text-sm" />
          </Field>
          <Field label="הערות פנימיות">
            <textarea {...register("dealer_notes")} rows={2} dir="rtl" className="w-full rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-3 text-sm" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תמונות הרכב (קישורים)</CardTitle>
          <p className="text-sm text-[var(--color-steel-dark)]">
            הדבק כתובת ישירה לתמונה (מסתיימת ב-.jpg / .png). התמונות יוצגו בעמוד הרכב
            בסדר שלהלן, והתמונה הראשונה תשמש כתמונה הראשית. קישור לעמוד חיפוש תמונות
            של גוגל לא יעבוד — צריך כתובת של התמונה עצמה.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VEHICLE_ANGLES.map((angle) => (
            <Field key={angle.key} label={angle.label}>
              <Input
                dir="ltr"
                placeholder="https://example.com/photo.jpg"
                value={angleUrls[angle.key] ?? ""}
                onChange={(e) => setAngleUrls((prev) => ({ ...prev, [angle.key]: e.target.value }))}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("published")} />
          מפורסם באתר
        </label>
        <Button type="submit" variant="gold" disabled={isSubmitting}>שמירה</Button>
      </div>
    </form>
  );
}
