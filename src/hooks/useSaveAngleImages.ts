import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAngleImages, type SaveAnglesResult } from "../lib/save-angle-images";
import type { AngleUrls } from "../lib/angles";

export type { SaveAnglesResult };

export function useSaveAngleImages(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (urls: AngleUrls) => saveAngleImages(vehicleId, urls),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
