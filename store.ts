import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, User, Order } from './types';
import { SPICE_DATA } from './data';

// --- Auth Store ---
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'spice-auth' }
  )
);

// --- Cart Store ---
interface CartState {
  items: CartItem[];
  wishlist: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, weight: string) => void;
  updateQuantity: (productId: string, weight: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      wishlist: [],
      addToCart: (newItem) => set((state) => {
        const existing = state.items.find(i => i.productId === newItem.productId && i.weight === newItem.weight);
        if (existing) {
          return {
            items: state.items.map(i =>
              (i.productId === newItem.productId && i.weight === newItem.weight)
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            )
          };
        }
        return { items: [...state.items, newItem] };
      }),
      removeFromCart: (id, weight) => set((state) => ({
        items: state.items.filter(i => !(i.productId === id && i.weight === weight))
      })),
      updateQuantity: (id, weight, qty) => set((state) => ({
        items: state.items.map(i =>
          (i.productId === id && i.weight === weight) ? { ...i, quantity: qty } : i
        )
      })),
      clearCart: () => set({ items: [] }),
      addToWishlist: (id) => set((state) => ({
        wishlist: state.wishlist.includes(id) ? state.wishlist : [...state.wishlist, id]
      })),
      removeFromWishlist: (id) => set((state) => ({
        wishlist: state.wishlist.filter(wId => wId !== id)
      })),
    }),
    { name: 'spice-cart' }
  )
);

// --- Data Store (Mock Backend) ---
interface DataState {
  products: Product[];
  orders: Order[];
  registeredUsers: User[]; // Simulating User Database
  addOrder: (order: Order) => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  registerUser: (user: User) => void;
  verifyUser: (email: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      products: SPICE_DATA,
      orders: [],
      registeredUsers: [
        { id: 'admin1', name: 'Admin User', email: 'admin@spice.com', role: 'admin', isVerified: true },
        { id: 'admin-viraj', name: 'Viraj Admin', email: 'yedviaviraj@gmail.com', role: 'admin', isVerified: true },
        { id: 'user1', name: 'Aditya Patel', email: 'user@example.com', role: 'customer', isVerified: true, mobile: '9876543210' }
      ],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateProduct: (product) => set((state) => ({
        products: state.products.map(p => p.id === product.id ? product : p)
      })),
      addProduct: (product) => set((state) => ({
        products: [product, ...state.products]
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      registerUser: (user) => set((state) => ({
        registeredUsers: [...state.registeredUsers, user]
      })),
      verifyUser: (email) => set((state) => ({
        registeredUsers: state.registeredUsers.map(u => 
          u.email === email ? { ...u, isVerified: true } : u
        )
      })),
    }),
    { name: 'spice-data' }
  )
);