import { supabase } from "./supabase";

/** Fire-and-forget audit trail. Never throws into the caller — a
 *  logging failure shouldn't fail the mutation it's describing. */
export async function logActivity(
  userId: string | null | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("Failed to write activity log", err);
  }
}
