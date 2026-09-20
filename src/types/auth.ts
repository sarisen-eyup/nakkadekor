export type TenantStatus = 
  | "loading" 
  | "unauthenticated" 
  | "needs_onboarding" 
  | "pending" 
  | "suspended" 
  | "active" 
  | "error";

export interface TenantRecord {
  id: string;
  name: string;
  slug?: string;
  status: "pending" | "active" | "suspended" | string;
  trade_title?: string;
  tagline?: string;
  tax_office?: string;
  tax_number?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  iban?: string;
  logo_url?: string;
  primary_color?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
