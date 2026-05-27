import type { BloodRequest } from "@/lib/types";

export function isActiveRequest(request: BloodRequest) {
  return request.status !== "Fulfilled" && request.status !== "Cancelled";
}

export function isOpenRequestForMatching(request: BloodRequest) {
  return isActiveRequest(request) && request.confirmationStatus !== "Confirmed";
}

export function isOpenRequestForDonors(request: BloodRequest) {
  return request.requestType !== "organ" && isOpenRequestForMatching(request) && !request.isRecipientRequest;
}

export function isPendingRequest(request: BloodRequest) {
  return (
    isActiveRequest(request) &&
    request.confirmationStatus !== "Confirmed" &&
    request.confirmationStatus !== "Rejected"
  );
}

export function getRequestPrimaryStatus(request: BloodRequest) {
  if (request.status === "Fulfilled" || request.status === "Cancelled") {
    return request.status;
  }

  if (request.confirmationStatus === "Rejected") {
    return request.isRecipientRequest ? "Hospital Rejected" : "Rejected";
  }

  if (request.confirmationStatus === "Confirmed") {
    return request.isRecipientRequest ? "Hospital Confirmed" : "Confirmed";
  }

  return request.status;
}

export function shouldShowRequestConfirmationBadge(request: BloodRequest) {
  const confirmationStatus = request.confirmationStatus;
  if (!confirmationStatus) {
    return false;
  }

  const primaryStatus = getRequestPrimaryStatus(request).toLowerCase();
  const normalizedConfirmation = confirmationStatus.toLowerCase();

  if (normalizedConfirmation === "pending" && primaryStatus === "pending") {
    return false;
  }

  if (normalizedConfirmation === "confirmed" && primaryStatus.includes("confirmed")) {
    return false;
  }

  if (normalizedConfirmation === "rejected" && primaryStatus.includes("rejected")) {
    return false;
  }

  return true;
}
