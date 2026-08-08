import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Label } from "./ui";
import { inquiryFormSchema, type InquiryFormInput } from "../lib/schemas";
import { useSubmitInquiry } from "../hooks/useInquiries";

export function InquiryForm({ vehicleId, defaultMessage }: { vehicleId?: string; defaultMessage?: string }) {
  const submit = useSubmitInquiry();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormInput>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { vehicle_id: vehicleId, message: defaultMessage },
  });

  if (submit.isSuccess) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-[var(--color-status-available)]">הפנייה נשלחה בהצלחה, נחזור אליכם בהקדם</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-[family-name:var(--font-display)] text-lg">השאירו פרטים</h3>

      <form onSubmit={handleSubmit((values) => submit.mutate(values))} className="mt-4 flex flex-col gap-3">
        <div>
          <Label htmlFor="full_name">שם מלא</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name && <p className="mt-1 text-xs text-[var(--color-status-sold)]">{errors.full_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input id="phone" dir="ltr" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-[var(--color-status-sold)]">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">דוא"ל</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-status-sold)]">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="message">הודעה (לא חובה)</Label>
          <textarea
            id="message"
            {...register("message")}
            rows={3}
            dir="rtl"
            className="w-full rounded-[var(--radius-card)] border border-[var(--color-steel)] bg-white p-3 text-sm"
          />
        </div>

        {submit.isError && <p className="text-xs text-[var(--color-status-sold)]">לא הצלחנו לשלוח את הפנייה, נסו שוב</p>}

        <Button type="submit" variant="gold" disabled={isSubmitting}>
          {isSubmitting ? "שולח..." : "שליחה"}
        </Button>
      </form>
    </Card>
  );
}
