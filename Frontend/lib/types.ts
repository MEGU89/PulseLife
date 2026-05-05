export type AppRole = "donor" | "hospital" | "recipient";

export interface AppUser {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: AppRole;
  bloodType?: string | null;
  hospitalId?: string | null;
  address?: string | null;
  available?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
  } | null;
  perks?: Array<{
    title?: string;
    description?: string;
    status?: string;
    expiryDate?: string;
    donationDate?: string;
  }>;
  totalDonations?: number;
  lastHealthCheckupDate?: string | null;
}

export interface BloodRequest {
  _id: string;
  requestType?: "blood";
  bloodType?: string | null;
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
  donorId?: {
    _id?: string;
    fullName?: string;
    email?: string;
  } | string;
  requestId?: BloodRequest | null;
  createdAt?: string;
}
