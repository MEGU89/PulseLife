export const DONATION_COOLDOWN_DAYS = 56;
export const MALE_DONATION_LIMIT_PER_YEAR = 6;
export const FEMALE_DONATION_LIMIT_PER_YEAR = 4;
export const DEFAULT_DONATION_LIMIT_PER_YEAR = 6;
export const BENEFIT_VALIDITY_DAYS = 30;
export const PREMIUM_PRIORITY_VALIDITY_DAYS = 365;

function normalizeDate(value) {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addDays(value, days) {
  const parsed = normalizeDate(value);
  if (!parsed) return null;

  const next = new Date(parsed);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function normalizeGender(gender) {
  const normalized = String(gender || "").trim().toLowerCase();
  if (normalized === "male" || normalized === "female" || normalized === "other") {
    return normalized;
  }

  return null;
}

export function getAnnualDonationLimit(gender) {
  const normalizedGender = normalizeGender(gender);
  if (normalizedGender === "female") {
    return FEMALE_DONATION_LIMIT_PER_YEAR;
  }

  if (normalizedGender === "male") {
    return MALE_DONATION_LIMIT_PER_YEAR;
  }

  return DEFAULT_DONATION_LIMIT_PER_YEAR;
}

export function getAnnualDonationSummary(donations, gender, referenceDate = new Date()) {
  const validReferenceDate = normalizeDate(referenceDate) || new Date();
  const windowStart = addDays(validReferenceDate, -365);

  const donationsWithinYear = (donations || [])
    .map((donation) => normalizeDate(donation?.date))
    .filter((date) => Boolean(date) && date <= validReferenceDate && date > windowStart)
    .sort((left, right) => left - right);

  const annualDonationLimit = getAnnualDonationLimit(gender);
  const annualDonationCount = donationsWithinYear.length;
  const annualDonationRemaining = Math.max(annualDonationLimit - annualDonationCount, 0);
  const nextAnnualEligibleDate =
    annualDonationCount >= annualDonationLimit && donationsWithinYear[0]
      ? addDays(donationsWithinYear[0], 365)
      : null;

  return {
    annualDonationLimit,
    annualDonationCount,
    annualDonationRemaining,
    nextAnnualEligibleDate,
  };
}

export function synchronizePerkStatuses(user, referenceDate = new Date()) {
  if (!user || !Array.isArray(user.perks)) {
    return false;
  }

  const now = normalizeDate(referenceDate) || new Date();
  let changed = false;

  user.perks.forEach((perk) => {
    const expiryDate = normalizeDate(perk?.expiryDate);
    if (perk?.status === "available" && expiryDate && expiryDate < now) {
      perk.status = "expired";
      changed = true;
    }
  });

  return changed;
}

export function buildDonationPerks({ completedAt, scheduleId, annualDonationCount }) {
  const donationDate = normalizeDate(completedAt) || new Date();
  const standardExpiryDate = addDays(donationDate, BENEFIT_VALIDITY_DAYS);
  const premiumExpiryDate = addDays(donationDate, PREMIUM_PRIORITY_VALIDITY_DAYS);
  const awardYear = donationDate.getUTCFullYear();

  const perks = [
    {
      type: "basic_health_checkup",
      tierKey: "post_donation_basic_health",
      title: "Basic Health Checkup",
      description: "Includes Blood Pressure, Sugar Test, Hemoglobin, BMI, and Pulse Rate after your donation.",
      benefitDate: donationDate,
      expiryDate: standardExpiryDate,
      status: "available",
      donationDate,
      claimedAt: null,
      usedAt: null,
      scheduleId,
      awardYear,
    },
  ];

  if (annualDonationCount === 1) {
    perks.push({
      type: "bp_hemoglobin_check",
      tierKey: "year_1_bp_hemoglobin",
      title: "Free BP + Hemoglobin Check",
      description: "Unlocked after your first donation in the rolling year window.",
      benefitDate: donationDate,
      expiryDate: standardExpiryDate,
      status: "available",
      donationDate,
      claimedAt: null,
      usedAt: null,
      scheduleId,
      awardYear,
    });
  }

  if (annualDonationCount === 2) {
    perks.push({
      type: "basic_health_checkup_bonus",
      tierKey: "year_2_basic_health_checkup",
      title: "Bonus Basic Health Checkup",
      description: "An additional free basic health checkup unlocked after your second donation in one year.",
      benefitDate: donationDate,
      expiryDate: standardExpiryDate,
      status: "available",
      donationDate,
      claimedAt: null,
      usedAt: null,
      scheduleId,
      awardYear,
    });
  }

  if (annualDonationCount === 3) {
    perks.push({
      type: "priority_appointment",
      tierKey: "year_3_priority_appointment",
      title: "Priority Appointment Booking",
      description: "Fast-track OPD queue and reduced waiting time. Valid for 30 days after donation.",
      benefitDate: donationDate,
      expiryDate: standardExpiryDate,
      status: "available",
      donationDate,
      claimedAt: null,
      usedAt: null,
      scheduleId,
      awardYear,
    });
  }

  if (annualDonationCount === 4) {
    perks.push({
      type: "blood_test_report",
      tierKey: "year_4_blood_test_report",
      title: "Free Blood Test Report",
      description: "Unlocked after your fourth donation in one year.",
      benefitDate: donationDate,
      expiryDate: standardExpiryDate,
      status: "available",
      donationDate,
      claimedAt: null,
      usedAt: null,
      scheduleId,
      awardYear,
    });
  }

  if (annualDonationCount >= 5) {
    perks.push(
      {
        type: "premium_donor_badge",
        tierKey: "year_5_premium_donor_badge",
        title: "Premium Donor Badge",
        description: "Special recognition for reaching five or more donations within one year.",
        benefitDate: donationDate,
        expiryDate: premiumExpiryDate,
        status: "available",
        donationDate,
        claimedAt: null,
        usedAt: null,
        scheduleId,
        awardYear,
      },
      {
        type: "family_emergency_priority",
        tierKey: "year_5_family_emergency_priority",
        title: "Family Emergency Priority",
        description: "Priority support for family emergency blood needs after reaching five or more donations in one year.",
        benefitDate: donationDate,
        expiryDate: premiumExpiryDate,
        status: "available",
        donationDate,
        claimedAt: null,
        usedAt: null,
        scheduleId,
        awardYear,
      }
    );
  }

  return perks;
}
