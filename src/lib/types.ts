export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profiles?: Profile;
}

export type ExpenseCategory =
  | "alojamiento"
  | "transporte"
  | "comida"
  | "equipamiento"
  | "skipass"
  | "actividades"
  | "otros";

export type CurrencyType = "ARS" | "USD" | "EUR" | "BRL";

export interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  currency: CurrencyType;
  category: ExpenseCategory;
  paid_by: string;
  split_type: string;
  receipt_url: string | null;
  created_at: string;
  profiles?: Profile;
  expense_splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
  profiles?: Profile;
}

export interface FlightWatch {
  id: string;
  trip_id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string | null;
  max_price: number | null;
  currency: CurrencyType;
  last_checked_at: string | null;
  last_price: number | null;
  lowest_price: number | null;
  alert_email: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Accommodation {
  id: string;
  trip_id: string;
  url: string;
  platform: string;
  name: string | null;
  price_per_night: number | null;
  currency: CurrencyType;
  total_price: number | null;
  location: string | null;
  rating: number | null;
  max_guests: number | null;
  image_url: string | null;
  last_scraped_at: string | null;
  price_history: { date: string; price: number }[];
  created_by: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  text: string;
  assigned_to: string | null;
  is_done: boolean;
  created_by: string | null;
  created_at: string;
  profiles?: Profile;
}

// Trip options (combo builder)
export type OptionCategory =
  | "alojamiento"
  | "transporte_ida"
  | "transporte_vuelta"
  | "skipass"
  | "equipamiento"
  | "comida"
  | "actividades"
  | "otros";

export interface TripOption {
  id: string;
  trip_id: string;
  category: OptionCategory;
  name: string;
  description: string | null;
  url: string | null;
  price: number | null;
  currency: string;
  price_per_person: number | null;
  is_per_person: boolean;
  image_url: string | null;
  notes: string | null;
  votes: string[];
  is_selected: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ComboSelection {
  id: string;
  trip_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
}

// Debt simplification
export interface Debt {
  from: string;
  from_name: string;
  to: string;
  to_name: string;
  amount: number;
  currency: CurrencyType;
}
