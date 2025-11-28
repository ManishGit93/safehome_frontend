export type UserRole = "child" | "parent" | "admin";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  consentGiven?: boolean;
  consentAt?: string | null;
  consentTextVersion?: string | null;
}

export interface LatestLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  ts: string;
}

export interface LinkedChild {
  id: string;
  name: string;
  email: string;
  consentGiven: boolean;
  lastLocation: LatestLocation | null;
}

export interface LocationPing {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  ts: string;
}


