import type { BloodRequest } from "@/lib/types";

export function isActiveRequest(request: BloodRequest) {
  return request.status !== "Fulfilled" && request.status !== "Cancelled";
}
