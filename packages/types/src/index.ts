// ─────────────────────────────────────────────────────────
// @landverify/types — shared domain types
// Used by: apps/web, and any future Node.js services
// Python equivalents live in apps/api/app/schemas/
// ─────────────────────────────────────────────────────────

// ── Nigeria geography ─────────────────────────────────────

export const PILOT_STATES = ["Lagos", "Abuja", "Rivers", "Oyo", "Ogun"] as const;
export const ALL_STATES_36 = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "Abuja", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigeriaState = typeof ALL_STATES_36[number];
export type PilotState = typeof PILOT_STATES[number];

export const TITLE_TYPES = [
  "C_OF_O",         // Certificate of Occupancy — strongest
  "R_OF_O",         // Right of Occupancy
  "GAZETTED",       // Government gazette
  "DEED_OF_ASSIGNMENT",
  "SURVEY_PLAN",
  "GOVERNORS_CONSENT",
  "EXCISION",
  "FREEHOLD",
  "UNKNOWN",
] as const;

export type TitleType = typeof TITLE_TYPES[number];

export const TITLE_RISK: Record<TitleType, "low" | "medium" | "high" | "unknown"> = {
  C_OF_O: "low",
  GAZETTED: "low",
  GOVERNORS_CONSENT: "low",
  FREEHOLD: "low",
  R_OF_O: "medium",
  EXCISION: "medium",
  DEED_OF_ASSIGNMENT: "medium",
  SURVEY_PLAN: "high",
  UNKNOWN: "unknown",
};

// ── Users & Roles ──────────────────────────────────────────

export type UserRole = "client" | "agent" | "field_verifier" | "admin";

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  kyc_status: KYCStatus;
  avatar_url?: string;
  nin_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type KYCStatus = "pending" | "submitted" | "verified" | "rejected" | "expired";

export interface AgentProfile {
  user_id: string;
  business_name?: string;
  license_number?: string;
  states_covered: NigeriaState[];
  lgas_covered: string[];
  subscription_tier: AgentTier;
  subscription_expires_at?: string;
  deals_closed: number;
  rating: number;           // 0–5
  review_count: number;
  is_visible: boolean;      // false if subscription lapsed
  verified_at?: string;
}

export type AgentTier = "free" | "professional" | "premium";

// ── Properties ────────────────────────────────────────────

export type PropertyType =
  | "flat"
  | "detached_house"
  | "semi_detached"
  | "terraced"
  | "land"
  | "commercial"
  | "duplex"
  | "bungalow";

export type PropertyStatus = "available" | "under_offer" | "sold" | "rented" | "suspended";

export type ListingPurpose = "sale" | "rent" | "shortlet";

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  type: PropertyType;
  purpose: ListingPurpose;
  status: PropertyStatus;

  // Location
  state: NigeriaState;
  lga: string;
  area: string;           // neighbourhood e.g. "Lekki Phase 1"
  address_detail?: string; // hidden until inquiry approved
  latitude?: number;
  longitude?: number;

  // Financials
  price: number;          // in Naira
  price_negotiable: boolean;
  service_charge?: number;
  caution_fee?: number;

  // Specs
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  size_sqm?: number;
  parking_spaces?: number;
  floors?: number;

  // Title & verification
  title_type: TitleType;
  risk_score: RiskScore;
  verification_status: VerificationStatus;

  // Media
  photos: PropertyPhoto[];
  virtual_tour_url?: string;
  floor_plan_url?: string;

  // Meta
  views: number;
  inquiries: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  order: number;
}

// ── Verification & Risk ────────────────────────────────────

export type VerificationStatus =
  | "unverified"
  | "documents_submitted"
  | "registry_check_pending"
  | "registry_check_passed"
  | "registry_check_failed"
  | "field_verified"
  | "fully_verified";

export interface RiskScore {
  score: number;            // 0–100, higher = safer
  level: "low" | "medium" | "high" | "critical";
  title_risk: "low" | "medium" | "high" | "unknown";
  encumbrance_check: boolean;
  survey_match: boolean;
  agent_verified: boolean;
  field_inspected: boolean;
  last_assessed_at: string;
}

export interface VerificationRecord {
  id: string;
  property_id: string;
  initiated_by: string;     // user_id
  assigned_verifier?: string;
  status: VerificationStatus;

  // Documents submitted
  documents: VerificationDocument[];

  // Registry result
  registry_reference?: string;
  registry_result?: "clear" | "encumbered" | "not_found" | "pending";
  registry_checked_at?: string;

  // Field inspection
  field_inspection_date?: string;
  field_notes?: string;
  field_photos?: string[];

  risk_score?: RiskScore;
  completed_at?: string;
  created_at: string;
}

export interface VerificationDocument {
  id: string;
  document_type: string;    // e.g. "C_OF_O", "SURVEY_PLAN", "TAX_CLEARANCE"
  file_url: string;
  uploaded_at: string;
  verified: boolean;
}

// ── Chat ──────────────────────────────────────────────────

export type ChatRoomStatus = "active" | "closed" | "archived";

export interface ChatRoom {
  id: string;
  property_id: string;
  client_id: string;
  agent_id: string;
  status: ChatRoomStatus;
  is_encrypted: boolean;
  created_at: string;
  last_message_at?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;          // encrypted at rest
  message_type: "text" | "system" | "document" | "inspection_request";
  read_at?: string;
  created_at: string;
}

// ── Search & Filters ──────────────────────────────────────

export interface PropertySearchParams {
  state?: NigeriaState;
  lga?: string;
  area?: string;
  purpose?: ListingPurpose;
  type?: PropertyType;
  title_type?: TitleType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  min_bedrooms?: number;
  verified_only?: boolean;
  risk_level?: "low" | "medium" | "high";
  page?: number;
  per_page?: number;
  sort_by?: "price_asc" | "price_desc" | "newest" | "risk_score";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ── API responses ──────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface APIError {
  success: false;
  error: string;
  detail?: string;
  code?: string;
}

// ── Auth ──────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  phone: string;
  full_name: string;
  password: string;
  role: Extract<UserRole, "client" | "agent">;
  nin?: string;             // required for agents
  referral_code?: string;
}
