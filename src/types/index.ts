export type Page = 'home' | 'student-details' | 'products' | 'order-review' | 'order-confirmation' | 'admin' | 'track-order' | 'feedback';

export interface CustomerDetails {
  fullName: string;
  phoneNumber: string;
  department: string;
  year: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meters_per_unit: number;
  image_url: string | null;
  is_active: boolean;
  stock: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
}

export interface SiteSettings {
  logo_url: string | null;
  site_name: string;
}

export interface Order {
  id: string;
  order_id: string;
  full_name: string;
  phone_number: string;
  department: string;
  year: string;
  total_amount: number;
  payment_method: string;
  status: string;
  items: OrderItem[];
  viewed: boolean;
  is_archived: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  department: string | null;
  created_at: string;
  is_displayed: boolean;
}
