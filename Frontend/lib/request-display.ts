import type { BloodRequest, RequestType } from "@/lib/types";

export function getRequestTypeLabel(requestType?: RequestType) {
  return requestType === "organ" ? "organ" : "blood";
}

export function getRequestNeedValue(request: Pick<BloodRequest, "requestType" | "bloodType" | "organType">) {
  if (request.requestType === "organ") {
    return request.organType || "Organ";
  }

  return request.bloodType || "Blood";
}

export function getRequestTitle(request: Pick<BloodRequest, "requestType" | "bloodType" | "organType">) {
  return `${getRequestNeedValue(request)} ${getRequestTypeLabel(request.requestType)} request`;
}

export function getRequestQuantityLabel(requestType?: RequestType) {
  return requestType === "organ" ? "Quantity needed" : "Units needed";
}

export function getRequestMapSummary(
  request: Pick<BloodRequest, "requestType" | "bloodType" | "organType" | "unitsNeeded" | "urgency">,
) {
  const quantitySuffix = request.requestType === "organ" ? "needed" : "units";
  return `${getRequestNeedValue(request)} - ${request.unitsNeeded} ${quantitySuffix} - ${request.urgency}`;
}
