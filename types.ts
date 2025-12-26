export interface Product {
  id: string;
  nameEn: string;
  nameHi: string;
  image: string;
  price100g: number;
  price1kg: number;
  stock: number;
  category: 'whole' | 'powder' | 'blend';
  description: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isTopSeller?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  weight: '100g' | '250g' | '500g' | '1kg';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  addresses?: Address[];
  mobile?: string;
  isVerified?: boolean;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'placed' | 'packed' | 'shipped' | 'delivered';
  date: string;
  paymentMethod: string;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';