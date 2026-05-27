export type AppRole = "donor" | "hospital" | "recipient";
export type RequestType = "blood" | "organ";

export interface AppUser {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: AppRole;
  bloodType?: string | null;
  gender?: "male" | "female" | "other" | null;
  hospitalId?: string | null;
  address?: string | null;
  available?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
  } | null;
  perks?: Array<{
    type?: string;
    tierKey?: string | null;
    title?: string;
    description?: string;
    status?: string;
    benefitDate?: string;
    expiryDate?: string;
    donationDate?: string;
    awardYear?: number | null;
  }>;
  totalDonations?: number;
  donationsThisYear?: number;
  lastHealthCheckupDate?: string | null;
  nextEligibleDonationDate?: string | null;
}

export interface BloodRequest {
  _id: string;
  requestType?: RequestType;
  bloodType?: string | null;
  organType?: string | null;
  unitsNeeded: number;
  hospital?: string | null;
  hospitalName?: string | null;
  destinationHospital?: string | null;
  urgency: string;
  distanceKm?: number | null;
  searchRadiusKm?: number | null;
  locationKm?: number;
  status: string;
  confirmationStatus?: string;
  confirmationNotes?: string | null;
  requestedBy?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
  } | null;
  recipientName?: string | null;
  isRecipientRequest?: boolean;
  phone?: string | null;
  address?: string | null;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  } | null;
  createdAt?: string;
}

export interface DonationSchedule {
  _id: string;
  donorName?: string;
  contact?: string;
  date?: string;
  time?: string;
  notes?: string;
  status?: string;
  hospitalResponse?: string;
  bloodType?: string;
  unitsNeeded?: number;
  medicalEligibility?: {
    age?: number;
    weightKg?: number;
    hasRecentFeverOrInfection?: boolean;
  };
  donorId?: {
    _id?: string;
    fullName?: string;
    email?: string;
  } | string;
  requestId?: BloodRequest | null;
  createdAt?: string;
}
