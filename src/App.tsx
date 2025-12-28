import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, Heart, User as UserIcon, Menu, X, Search, Star, Truck, ShieldCheck, Leaf, ArrowRight, Minus, Plus, Trash2, Home, Package, BarChart3, Users, LogOut, CheckCircle, ChevronDown, Filter, Sparkles, Loader2, Upload, Zap, Mail, Phone, MapPin, Calendar, Lock, AlertCircle, TrendingUp, DollarSign, ShoppingCart, Percent, Edit2, Save, Image as ImageIcon, Clock, CreditCard, Eye, EyeOff, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";

import { useAuthStore, useCartStore, useDataStore } from './store';
import { Product, CartItem, Order, User } from './types';
import { SPICE_DATA } from './data';

// --- Utility Components ---

const Button = ({ children, variant = 'primary', className = '', type = 'button', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg",
    secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
    outline: "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
    ghost: "text-stone-600 hover:bg-stone-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return <button type={type} className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

const PriceDisplay = ({ price, size = 'md' }: { price: number, size?: 'sm'|'md'|'lg' }) => {
  const sizeClass = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  return <span className={`font-serif font-bold text-brand-800 ${sizeClass[size]}`}>₹{price || 0}</span>;
};

// --- Modals ---

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: Product | null; 
  onSave: (product: Product) => void; 
}) => {
  const [formData, setFormData] = useState<Product>({
    id: '',
    nameEn: '',
    nameHi: '',
    image: '',
    price100g: 0,
    price1kg: 0,
    stock: 0,
    category: 'whole',
    description: '',
    rating: 5,
    reviews: 0,
    isNew: false,
    isTopSeller: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        id: `prod-${Date.now()}`,
        nameEn: '',
        nameHi: '',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop',
        price100g: 0,
        price1kg: 0,
        stock: 100,
        category: 'whole',
        description: '',
        rating: 0,
        reviews: 0,
        isNew: true
      });
    }
    setIsSaving(false);
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (isSaving) return;
    setIsSaving(true);
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-stone-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">English Name</label>
                <input name="nameEn" value={formData.nameEn} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Turmeric" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Hindi Name</label>
                <input name="nameHi" value={formData.nameHi} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Haldi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (100g)</label>
                  <input type="number" name="price100g" value={formData.price100g} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (1kg)</label>
                  <input type="number" name="price1kg" value={formData.price1kg} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Stock Quantity</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="whole">Whole Spice</option>
                  <option value="powder">Powder</option>
                  <option value="blend">Blend</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Product Image</label>
                <div className="relative aspect-square bg-stone-100 rounded-lg overflow-hidden border-2 border-dashed border-stone-300 hover:border-brand-500 transition-colors group">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-8 h-8 text-white mb-2" />
                    <span className="text-white text-sm font-medium">Change Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 cursor-pointer opacity-0" />
                  </div>
                </div>
                <div className="mt-2">
                   <input 
                     type="text" 
                     name="image" 
                     value={formData.image} 
                     onChange={handleChange} 
                     className="w-full p-2 border rounded-lg text-xs text-stone-900 bg-white placeholder-stone-400 focus:ring-2 focus:ring-brand-500 outline-none" 
                     placeholder="Or paste image URL" 
                   />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleCheckboxChange} className="rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm text-stone-700">New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isTopSeller" checked={formData.isTopSeller} onChange={handleCheckboxChange} className="rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm text-stone-700">Top Seller</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Describe the spice..." />
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Product
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserHistoryModal = ({ 
  user, 
  onClose 
}: { 
  user: User | null; 
  onClose: () => void; 
}) => {
  const { orders } = useDataStore();
  
  if (!user) return null;

  const userOrders = orders.filter(o => o.userId === user.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Order History</h2>
            <p className="text-sm text-stone-500">For {user.name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {userOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No orders found for this customer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="bg-stone-50 px-4 py-3 flex justify-between items-center text-sm border-b border-stone-100">
                    <span className="font-mono font-medium">{order.id}</span>
                    <span className="text-stone-500">{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{order.status}</span>
                      <span className="font-bold">₹{order.total}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {order.items.length} items • {order.paymentMethod}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Navbar ---

const Navbar = () => {
  const { items, wishlist } = useCartStore();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24 items-center">
          {/* Logo - Highlighted as requested */}
          <Link to="/" className="flex flex-col justify-center">
            <span className="text-4xl md:text-5xl font-serif font-black text-brand-800 tracking-tight leading-none drop-shadow-sm">
              SpicePatrao
            </span>
            <span className="text-xs text-brand-600 tracking-[0.3em] uppercase font-medium ml-1 mt-1">
              Est. 2018
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-stone-600 hover:text-brand-600 font-medium">Home</Link>
            <Link to="/products" className="text-stone-600 hover:text-brand-600 font-medium">Shop</Link>
            <Link to="/about" className="text-stone-600 hover:text-brand-600 font-medium">About</Link>
            
            <div className="flex items-center space-x-4 border-l pl-6 border-stone-200">
              <Link to="/wishlist" className="relative p-2 text-stone-600 hover:text-brand-600 transition group">
                <Heart className={`w-6 h-6 transition-colors ${wishlist.length > 0 ? 'fill-red-50 text-red-500' : ''}`} />
                {wishlist.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              <Link to="/cart" className="relative p-2 text-stone-600 hover:text-brand-600 transition">
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 text-stone-600 hover:text-brand-600">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                       {user.name.charAt(0)}
                    </div>
                  </button>
                  <div className="absolute right-0 w-48 bg-white shadow-xl rounded-xl py-2 hidden group-hover:block border border-stone-100 mt-2 z-50">
                    <div className="px-4 py-3 text-sm text-stone-500 border-b border-stone-100 mb-2 bg-stone-50">
                       <p className="font-bold text-stone-800">{user.name}</p>
                       <p className="text-xs">{user.email}</p>
                    </div>
                    {user.role === 'admin' && <Link to="/admin" className="block px-4 py-2 hover:bg-brand-50 text-brand-700 font-medium">Admin Dashboard</Link>}
                    <Link to="/profile" className="block px-4 py-2 hover:bg-brand-50 text-stone-700">Orders & Profile</Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                       <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 text-white hover:bg-brand-600 transition-colors shadow-sm">
                   <UserIcon className="w-4 h-4" />
                   <span className="font-medium text-sm">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <Link to="/cart" className="relative p-2 text-stone-600">
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
              </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-stone-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-4">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-600">Home</Link>
          <Link to="/products" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-600">Shop Spices</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-600">About Us</Link>
          <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-600">Wishlist ({wishlist.length})</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-600">My Account</Link>
              {user.role === 'admin' && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-brand-600 font-bold">Admin Dashboard</Link>}
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-red-600">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block py-2 text-brand-600 font-bold">Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Global Layout Components defined before use ---

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="text-2xl font-serif font-bold text-white mb-4">SpicePatrao</div>
          <p className="mb-4">Bringing the authentic flavors of Indian heritage spices to your kitchen since 2018.</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Shop</h4>
          <ul className="space-y-2">
            <li><Link to="/products" className="hover:text-brand-500 transition-colors">All Spices</Link></li>
            <li><Link to="/products?category=whole" className="hover:text-brand-500 transition-colors">Whole Spices</Link></li>
            <li><Link to="/products?category=powder" className="hover:text-brand-500 transition-colors">Powders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-brand-500 transition-colors">About Us</Link></li>
            <li><Link to="/" className="hover:text-brand-500 transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Newsletter</h4>
          <p className="mb-4 text-sm">Subscribe to get special offers.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Email" className="bg-stone-800 border-none rounded-lg px-3 py-2 text-white w-full" />
            <button className="bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700">Go</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-stone-800 text-center text-sm">
        &copy; {new Date().getFullYear()} SpicePatrao. All rights reserved.
      </div>
    </footer>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  
  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-600">
      {!isDashboard && <Navbar />}
      <main className={`flex-1 ${!isDashboard ? 'bg-white' : ''}`}>
        {children}
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="aspect-square bg-stone-200 animate-pulse"></div>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-3/4">
            <div className="h-5 bg-stone-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-stone-200 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="w-12 h-5 bg-stone-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
             <div className="h-3 bg-stone-200 rounded w-10 animate-pulse"></div>
             <div className="h-6 bg-stone-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useCartStore();
  const [selectedWeight, setSelectedWeight] = useState<'100g' | '1kg'>('100g');
  const isWishlisted = wishlist.includes(product.id);
  const currentPrice = selectedWeight === '100g' ? product.price100g : product.price1kg;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ productId: product.id, quantity: 1, weight: selectedWeight });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) removeFromWishlist(product.id);
    else addToWishlist(product.id);
  };

  const handleWeightToggle = (e: React.MouseEvent, weight: '100g' | '1kg') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWeight(weight);
  };

  return (
    <Link to={`/product/${product.id}`} className="group bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <img src={product.image} alt={product.nameEn} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.isNew && <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>}
        {product.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-stone-800">OUT OF STOCK</div>}
        <button onClick={handleWishlistClick} className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm z-10">
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-stone-800 text-lg leading-tight">{product.nameEn}</h3>
            <p className="text-brand-600 font-serif text-sm">{product.nameHi}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
             <Star className="w-3 h-3 fill-amber-700" /> {product.rating}
          </div>
        </div>
        <div className="mt-auto pt-2">
          <div className="flex bg-stone-100 rounded-lg p-1 w-full text-xs font-medium mb-3">
             <button onClick={(e) => handleWeightToggle(e, '100g')} className={`flex-1 py-1 rounded-md transition-all ${selectedWeight === '100g' ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>100g</button>
             <button onClick={(e) => handleWeightToggle(e, '1kg')} className={`flex-1 py-1 rounded-md transition-all ${selectedWeight === '1kg' ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>1kg</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
               <span className="text-xs text-stone-400">Price</span>
               <div className="flex items-baseline gap-1"><PriceDisplay price={currentPrice} size="md" /></div>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="h-9 px-4 rounded-lg bg-brand-600 text-white font-medium text-sm flex items-center justify-center hover:bg-brand-700 transition-colors gap-2"><ShoppingBag className="w-4 h-4" /> Add</button>
          </div>
        </div>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const { products } = useDataStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'whole' | 'powder' | 'blend'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const matches = products.filter(p => p.nameEn.toLowerCase().includes(query.toLowerCase()) || p.nameHi.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchQuery.trim()) navigate('/products', { state: { search: searchQuery } });
  };

  const filteredProducts = products.filter(p => activeCategory === 'all' || p.category === activeCategory);
  const categories = [{ id: 'all', label: 'All Spices' }, { id: 'whole', label: 'Whole Spices' }, { id: 'powder', label: 'Powders' }, { id: 'blend', label: 'Masala Blends' }];

  return (
    <div className="bg-brand-50 min-h-screen">
      <div className="relative bg-stone-900 h-[650px] flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Spices" />
        <div className="relative z-10 text-center px-4 flex flex-col items-center max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-serif text-brand-300 font-medium mb-3 tracking-[0.2em] uppercase drop-shadow-md">SpicePatrao</h2>
          <h1 className="text-5xl md:text-8xl font-serif text-white font-bold mb-6 drop-shadow-xl leading-none">Pure Spices.<br/>Honest Flavour.</h1>
          <p className="text-lg md:text-2xl text-stone-200 mb-8 font-light max-w-2xl leading-relaxed">Hand-picked from the finest farms in Kerala. Stone-ground to preserve the soul of India.</p>
          <div className="w-full max-w-lg relative mb-8" ref={searchRef}>
             <form onSubmit={handleSearchSubmit} className="relative">
                <input type="text" placeholder="Find your flavor (e.g., Turmeric, Haldi)..." className="w-full px-6 py-4 rounded-full text-stone-800 focus:outline-none focus:ring-4 focus:ring-brand-500/50 shadow-2xl text-lg pl-12" value={searchQuery} onChange={handleSearchInput} onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)} />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-6 h-6" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 transition"><ArrowRight className="w-5 h-5" /></button>
             </form>
             {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden text-left z-20">
                   {suggestions.map(product => (
                      <Link key={product.id} to={`/product/${product.id}`} className="flex items-center gap-4 p-3 hover:bg-stone-50 transition border-b border-stone-50 last:border-0">
                         <img src={product.image} alt={product.nameEn} className="w-10 h-10 rounded-md object-cover" />
                         <div><div className="font-bold text-stone-800">{product.nameEn}</div><div className="text-xs text-brand-600 font-medium">{product.nameHi}</div></div>
                      </Link>
                   ))}
                </div>
             )}
          </div>
          <Link to="/products"><Button size="lg" className="text-lg px-12 py-3 shadow-2xl bg-white/10 backdrop-blur-md hover:bg-white hover:text-brand-800 border-2 border-white/30 text-white rounded-full transition-all">Browse Catalog</Button></Link>
        </div>
      </div>
      <div className="py-16 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center group"><div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><Leaf className="w-10 h-10" /></div><h3 className="text-xl font-serif font-bold text-stone-800">100% Natural</h3><p className="text-stone-500 mt-3 leading-relaxed">Sourced directly from organic farms. No preservatives, no additives, just pure nature.</p></div>
          <div className="flex flex-col items-center group"><div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><ShieldCheck className="w-10 h-10" /></div><h3 className="text-xl font-serif font-bold text-stone-800">Freshly Packed</h3><p className="text-stone-500 mt-3 leading-relaxed">Ground in small batches and vacuum sealed immediately to lock in the essential oils.</p></div>
          <div className="flex flex-col items-center group"><div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><Truck className="w-10 h-10" /></div><h3 className="text-xl font-serif font-bold text-stone-800">Pan-India Delivery</h3><p className="text-stone-500 mt-3 leading-relaxed">From Kashmir to Kanyakumari, we deliver authentic flavors to 25,000+ pin codes.</p></div>
        </div>
      </div>
      <div className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-stone-800 mb-4">Our Collection</h2>
          <div className="w-24 h-1 bg-brand-600 mx-auto rounded-full"></div>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${activeCategory === cat.id ? 'bg-stone-900 text-white shadow-lg transform scale-105' : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-300 hover:text-brand-600 hover:shadow-md'}`}>{cat.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)) : (filteredProducts.map(product => (<ProductCard key={product.id} product={product} />)))}
        </div>
        {!isLoading && filteredProducts.length === 0 && (<div className="text-center py-20 text-stone-500 bg-white rounded-xl border border-stone-100"><Package className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No products found in this category.</p></div>)}
        <div className="mt-16 text-center"><Link to="/products"><Button variant="outline" className="px-8 py-3 rounded-full">View Full Catalog <ArrowRight className="w-4 h-4 ml-2" /></Button></Link></div>
      </div>
      <div className="py-24 bg-brand-900 text-white px-4 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Join the SpicePatrao Family</h2>
            <p className="mb-10 text-brand-100 text-lg leading-relaxed">Unlock exclusive recipes, early access to new harvests, and get <span className="text-white font-bold">10% OFF</span> your first order of authentic spices.</p>
            <Link to="/login"><Button variant="secondary" className="px-10 py-4 text-lg rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">Create Free Account</Button></Link>
         </div>
      </div>
    </div>
  );
};

const ProductListPage = () => {
  const { products } = useDataStore();
  const location = useLocation();
  const [filter, setFilter] = useState<'all' | 'whole' | 'powder'>('all');
  const [sort, setSort] = useState<string>('featured');
  const [search, setSearch] = useState(location.state?.search || '');
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (val.length > 1) {
      const matches = products.filter(p => p.nameEn.toLowerCase().includes(val.toLowerCase()) || p.nameHi.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const filteredProducts = products
    .filter(p => filter === 'all' || p.category === filter)
    .filter(p => p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.nameHi.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price100g - b.price100g;
      if (sort === 'price-desc') return b.price100g - a.price100g;
      if (sort === 'newest') return (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative w-full md:w-96" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
            <input type="text" placeholder="Search for spices (e.g. Cumin, Jeera)..." className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" value={search} onChange={handleSearchInput} onFocus={() => search.length > 1 && setShowSuggestions(true)} />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-stone-100 z-50 overflow-hidden">
                {suggestions.map(p => (
                    <Link to={`/product/${p.id}`} key={p.id} className="flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0">
                        <img src={p.image} alt={p.nameEn} className="w-10 h-10 rounded object-cover" />
                        <div><div className="font-bold text-stone-800 text-sm">{p.nameEn}</div><div className="text-xs text-brand-600">{p.nameHi}</div></div>
                    </Link>
                ))}
            </div>
          )}
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-4 py-2 border border-stone-200 rounded-lg bg-white">
            <option value="all">All Types</option>
            <option value="whole">Whole Spices</option>
            <option value="powder">Powders</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-2 border border-stone-200 rounded-lg bg-white">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">New Arrivals</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-stone-500"><p className="text-xl">No spices found matching your criteria.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { products } = useDataStore();
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useCartStore();
  const product = products.find(p => p.id === id);
  const [weight, setWeight] = useState<'100g'|'250g'|'500g'|'1kg'>('100g');
  const [qty, setQty] = useState(1);

  if (!product) return <div className="p-20 text-center">Product not found</div>;

  const getPrice = (w: string) => {
    if (w === '1kg') return product.price1kg;
    if (w === '500g') return product.price1kg / 2 * 1.05; 
    if (w === '250g') return product.price100g * 2.5 * 0.95; 
    return product.price100g;
  };

  const currentPrice = Math.round(getPrice(weight));
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
             <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm"><img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" /></div>
          </div>
          <div>
             <div className="mb-6">
                <h1 className="text-4xl font-serif font-bold text-stone-800">{product.nameEn}</h1>
                <h2 className="text-2xl font-serif text-brand-600 mt-1">{product.nameHi}</h2>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex text-amber-500">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-stone-300'}`} />)}</div>
                   <span className="text-sm text-stone-500">{product.reviews} Reviews</span>
                   <span className={`text-sm font-bold px-2 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                </div>
             </div>
             <p className="text-stone-600 leading-relaxed mb-6">{product.description}</p>
             <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-stone-600">Pack Weight</span>
                   <div className="flex gap-2">{['100g', '250g', '500g', '1kg'].map((w) => (<button key={w} onClick={() => setWeight(w as any)} className={`px-3 py-1 text-sm rounded border ${weight === w ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-stone-600 border-stone-300 hover:border-brand-500'}`}>{w}</button>))}</div>
                </div>
                <div className="flex items-center justify-between mb-6">
                   <div><PriceDisplay price={currentPrice} size="lg" /><span className="text-stone-400 text-sm ml-2">Inclusive of all taxes</span></div>
                   <div className="flex items-center gap-3 border border-stone-300 rounded-lg px-2 py-1">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 hover:text-brand-600"><Minus className="w-4 h-4" /></button>
                      <span className="font-medium w-8 text-center">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="p-1 hover:text-brand-600"><Plus className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="flex gap-4">
                   <Button onClick={() => addToCart({ productId: product.id, quantity: qty, weight })} className="flex-1 py-3" disabled={product.stock === 0}><ShoppingBag className="w-5 h-5" /> Add to Cart</Button>
                   <button onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id)} className={`p-3 border rounded-lg transition-colors ${isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-stone-300 text-stone-400 hover:border-brand-500 hover:text-brand-500'}`}><Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} /></button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const CartPage = () => {
  const { items, updateQuantity, removeFromCart } = useCartStore();
  const { products } = useDataStore();
  const navigate = useNavigate();

  const cartTotal = items.reduce((sum, item) => {
     const p = products.find(prod => prod.id === item.productId);
     if (!p) return sum;
     let price = p.price100g;
     if (item.weight === '1kg') price = p.price1kg;
     else if (item.weight === '250g') price = p.price100g * 2.5 * 0.95;
     else if (item.weight === '500g') price = p.price1kg / 2 * 1.05;
     return sum + (Math.round(price) * item.quantity);
  }, 0);

  if (items.length === 0) {
     return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
           <ShoppingBag className="w-16 h-16 text-stone-300 mb-4" />
           <h2 className="text-2xl font-serif text-stone-800 mb-2">Your cart is empty</h2>
           <p className="text-stone-500 mb-8">Looks like you haven't added any spices yet.</p>
           <Link to="/products"><Button>Start Shopping</Button></Link>
        </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">Shopping Cart</h1>
       <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
             {items.map((item) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                let price = product.price100g;
                if (item.weight === '1kg') price = product.price1kg;
                else if (item.weight === '250g') price = product.price100g * 2.5 * 0.95;
                else if (item.weight === '500g') price = product.price1kg / 2 * 1.05;
                const unitPrice = Math.round(price);

                return (
                   <div key={`${item.productId}-${item.weight}`} className="flex gap-4 bg-white p-4 rounded-xl border border-stone-200">
                      <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0"><img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-2">
                            <div><h3 className="font-bold text-stone-800">{product.nameEn}</h3><p className="text-sm text-stone-500">{item.weight} pack</p></div>
                            <PriceDisplay price={unitPrice * item.quantity} />
                         </div>
                         <div className="flex justify-between items-end mt-4">
                            <div className="flex items-center gap-3 border border-stone-300 rounded px-2 py-1 bg-stone-50">
                               <button onClick={() => updateQuantity(item.productId, item.weight, Math.max(1, item.quantity - 1))} className="p-1 hover:text-brand-600"><Minus className="w-3 h-3" /></button>
                               <span className="text-sm w-4 text-center">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)} className="p-1 hover:text-brand-600"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => removeFromCart(item.productId, item.weight)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   </div>
                );
             })}
          </div>
          <div className="w-full lg:w-96">
             <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm sticky top-24">
                <h3 className="font-bold text-lg mb-4 text-stone-800">Order Summary</h3>
                <div className="space-y-3 mb-6">
                   <div className="flex justify-between text-stone-600"><span>Subtotal</span> <span>₹{cartTotal}</span></div>
                   <div className="flex justify-between text-stone-600"><span>Shipping</span> <span className="text-green-600">Free</span></div>
                   <div className="border-t pt-3 flex justify-between font-bold text-lg text-stone-800"><span>Total</span> <span>₹{cartTotal}</span></div>
                </div>
                <Button onClick={() => navigate('/checkout')} className="w-full py-3">Proceed to Checkout</Button>
                <div className="mt-4 text-center text-xs text-stone-400 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Payment</div>
             </div>
          </div>
       </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { addOrder } = useDataStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handlePlaceOrder = () => {
     const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        userId: user?.id || 'guest',
        items: [...items],
        total: items.reduce((acc, i) => acc + (i.quantity * 100), 0), // simplified
        status: 'placed',
        date: new Date().toISOString(),
        paymentMethod: 'UPI'
     };
     addOrder(newOrder);
     clearCart();
     setStep(3);
  };

  if (step === 3) {
     return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6"><CheckCircle className="w-10 h-10" /></div>
           <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">Order Confirmed!</h1>
           <p className="text-stone-500 mb-8 max-w-md">Thank you for shopping with SpicePatrao. Your aromatic spices will be packed with care and shipped shortly.</p>
           <div className="flex gap-4"><Link to="/"><Button variant="outline">Back Home</Button></Link><Link to="/profile"><Button>View Order</Button></Link></div>
        </div>
     );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
       <h1 className="text-2xl font-serif font-bold mb-6">Checkout</h1>
       <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm">1</div> Shipping Address</h2>
             {step === 1 && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="First Name" className="border p-2 rounded w-full" defaultValue={user?.name?.split(' ')[0]} /><input type="text" placeholder="Last Name" className="border p-2 rounded w-full" /></div>
                   <input type="text" placeholder="Address Line 1" className="border p-2 rounded w-full" />
                   <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="City" className="border p-2 rounded w-full" /><input type="text" placeholder="Pincode" className="border p-2 rounded w-full" /></div>
                   <Button onClick={() => setStep(2)} className="mt-4">Continue to Payment</Button>
                </div>
             )}
          </div>
          <div className="p-6">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-brand-100 text-brand-600' : 'bg-stone-100 text-stone-400'}`}>2</div> Payment Method</h2>
             {step === 2 && (
                <div className="space-y-4">
                   <div className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-brand-500 bg-brand-50 border-brand-200"><div className="w-4 h-4 rounded-full border border-brand-600 bg-brand-600"></div><span className="font-medium">UPI (Google Pay / PhonePe)</span></div>
                   <div className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-brand-500 opacity-60"><div className="w-4 h-4 rounded-full border border-stone-400"></div><span className="font-medium">Credit / Debit Card</span></div>
                   <Button onClick={handlePlaceOrder} className="w-full mt-6 py-3">Place Order</Button>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- Profile Page ---
const ProfilePage = () => {
  const { user } = useAuthStore();
  const { orders } = useDataStore();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;

  const userOrders = orders.filter(o => o.userId === user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-3xl mx-auto mb-4 border border-brand-200">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-center text-stone-800">{user.name}</h2>
            <p className="text-center text-stone-500 text-sm mb-6">{user.email}</p>
            
            <div className="space-y-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-3 text-stone-600 text-sm">
                <MapPin className="w-4 h-4" /> <span>Manage Addresses</span>
              </div>
              <div className="flex items-center gap-3 text-stone-600 text-sm">
                <CreditCard className="w-4 h-4" /> <span>Payment Methods</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold text-stone-800 mb-4">Order History</h3>
          {userOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-stone-200 text-center text-stone-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>You haven't placed any orders yet.</p>
              <Link to="/products"><Button className="mt-4" variant="outline">Start Shopping</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                      <span className="font-bold text-stone-700">{order.id}</span>
                      <span className="text-stone-500">{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-stone-500">
                        {order.items.length} items
                      </div>
                      <div className="font-bold text-lg text-stone-800">
                        ₹{order.total}
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                         <p className="text-xs text-stone-400">Items included in order.</p>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                       <Button variant="outline" className="text-xs py-1 h-8">Track Order</Button>
                       <Button variant="secondary" className="text-xs py-1 h-8">View Invoice</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Admin Dashboard ---

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { products, orders, updateProduct, addProduct, deleteProduct, registeredUsers } = useDataStore();
  const [activeTab, setActiveTab] = useState<'analytics'|'products'|'orders'|'users'>('analytics');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // New state for User History Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" />;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async (product: Product, refImage?: string) => {
    setGeneratingFor(product.id);
    try {
      if (!process.env.API_KEY) {
        alert('API Key not found. Please ensure process.env.API_KEY is set.');
        setGeneratingFor(null);
        return;
      }

      let prompt = `A photorealistic product shot of a white stand-up spice pouch branded "SpicePatrao".
      The pouch features clear, bold typography saying "${product.nameEn}" and "${product.nameHi}".
      The bottom half of the pouch has an orange/terracotta pattern.
      Next to the pouch is a small wooden bowl filled with fresh ${product.nameEn}.
      The background is a dark, warm, textured wood surface.
      Cinematic lighting, high resolution, 4k.`;

      const contentsPart: any[] = [{ text: prompt }];

      if (refImage) {
        const base64Data = refImage.split(',')[1];
        contentsPart.push({ 
           inlineData: { 
             mimeType: 'image/png',
             data: base64Data 
           } 
        });
        prompt += " Use the provided image as a strict reference for the packaging style, lighting, composition, and background. Only change the text on the packet and the spice inside the bowl to match the product described.";
        contentsPart[0].text = prompt;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: contentsPart,
        },
      });

      let base64Image = null;
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
         for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
               base64Image = part.inlineData.data;
               break;
            }
         }
      }

      if (base64Image) {
        const imageUrl = `data:image/png;base64,${base64Image}`;
        updateProduct({ ...product, image: imageUrl });
      } else {
        console.error('Failed to generate image', response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleGenerateAll = async () => {
     if (!referenceImage) {
        if(!confirm("No reference image uploaded. Images will be generated based on default style instructions. Continue?")) return;
     }
     setIsGeneratingAll(true);
     for (const product of products) {
        await handleGenerateImage(product, referenceImage || undefined);
        await new Promise(r => setTimeout(r, 1000));
     }
     setIsGeneratingAll(false);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if(confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }
    setIsModalOpen(false);
  };

  // --- Analytics Data ---
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 124500);
  const totalOrders = orders.length + 1240;
  const conversionRate = 3.2;
  const revenueData = [{ name: 'Mon', revenue: 4000 }, { name: 'Tue', revenue: 3000 }, { name: 'Wed', revenue: 2000 }, { name: 'Thu', revenue: 2780 }, { name: 'Fri', revenue: 1890 }, { name: 'Sat', revenue: 2390 }, { name: 'Sun', revenue: 3490 }];
  const ordersData = [{ name: 'Mon', orders: 24 }, { name: 'Tue', orders: 13 }, { name: 'Wed', orders: 98 }, { name: 'Thu', orders: 39 }, { name: 'Fri', orders: 48 }, { name: 'Sat', orders: 38 }, { name: 'Sun', orders: 43 }];
  const topSelling = products.filter(p => p.isTopSeller).slice(0, 5);

  return (
    <div className="flex h-screen bg-stone-50">
       <ProductModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         product={editingProduct} 
         onSave={handleSaveProduct} 
       />
       
       <UserHistoryModal 
         user={selectedUser} 
         onClose={() => setSelectedUser(null)} 
       />

       <aside className="w-64 bg-stone-900 text-white hidden md:flex flex-col">
          <div className="p-6 text-2xl font-serif font-bold text-brand-400">SpicePatrao<span className="text-xs block font-sans text-stone-500 font-normal">Admin Panel</span></div>
          <nav className="flex-1 px-4 space-y-2">
             <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'analytics' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}><BarChart3 className="w-5 h-5" /> Analytics</button>
             <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'products' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}><Package className="w-5 h-5" /> Products</button>
             <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'orders' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}><Users className="w-5 h-5" /> Orders</button>
             <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'users' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}><Users className="w-5 h-5" /> Users</button>
          </nav>
          <div className="p-4 border-t border-stone-800"><Link to="/" className="flex items-center gap-2 text-stone-400 hover:text-white"><Home className="w-4 h-4"/> Back to Store</Link></div>
       </aside>

       <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'analytics' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-stone-800">Analytics Dashboard</h1><div className="text-sm text-stone-500 bg-white px-3 py-1 rounded-md border shadow-sm">Last 7 Days</div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between"><div><div className="text-stone-500 text-sm mb-1 font-medium">Total Revenue</div><div className="text-3xl font-bold text-stone-800">₹{totalRevenue.toLocaleString()}</div><div className="text-green-600 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12.5% vs last week</div></div><div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><DollarSign className="w-6 h-6" /></div></div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between"><div><div className="text-stone-500 text-sm mb-1 font-medium">Total Orders</div><div className="text-3xl font-bold text-stone-800">{totalOrders}</div><div className="text-green-600 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +8.2% vs last week</div></div><div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><ShoppingCart className="w-6 h-6" /></div></div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between"><div><div className="text-stone-500 text-sm mb-1 font-medium">Conversion Rate</div><div className="text-3xl font-bold text-stone-800">{conversionRate}%</div><div className="text-red-500 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 rotate-180"/> -1.1% vs last week</div></div><div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600"><Percent className="w-6 h-6" /></div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-80"><h3 className="font-bold text-lg mb-6 text-stone-800">Revenue Over Time</h3><ResponsiveContainer width="100%" height="100%"><LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Line type="monotone" dataKey="revenue" stroke="#b9663b" strokeWidth={3} dot={{ fill: '#b9663b', r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-80"><h3 className="font-bold text-lg mb-6 text-stone-800">Orders Over Time</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={ordersData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f5efe4'}} /><Bar dataKey="orders" fill="#d09f6e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                    <h3 className="font-bold text-lg mb-6 text-stone-800">Top Selling Spices</h3>
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-stone-50 text-stone-500 font-medium"><tr><th className="px-6 py-4 rounded-l-lg">Product</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 text-right">Sales</th><th className="px-6 py-4 text-right rounded-r-lg">Revenue</th></tr></thead><tbody className="divide-y divide-stone-100">{topSelling.map((p, index) => (<tr key={p.id} className="hover:bg-stone-50"><td className="px-6 py-4 flex items-center gap-3"><div className="font-bold text-stone-400 w-4">#{index + 1}</div><img src={p.image} className="w-10 h-10 rounded-md object-cover bg-stone-200" alt="" /><div><div className="font-bold text-stone-800">{p.nameEn}</div><div className="text-xs text-stone-500">{p.nameHi}</div></div></td><td className="px-6 py-4 capitalize text-stone-600">{p.category}</td><td className="px-6 py-4 text-right font-medium">{150 - (index * 20)} orders</td><td className="px-6 py-4 text-right font-bold text-stone-800">₹{(p.price100g * (150 - (index * 20))).toLocaleString()}</td></tr>))}</tbody></table></div>
                </div>
             </div>
          )}

          {activeTab === 'products' && (
             <div>
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-2xl font-bold text-stone-800">Products Inventory</h1>
                   <div className="flex gap-4">
                     <Button variant="outline" className="relative overflow-hidden"><input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />{referenceImage ? <span className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4"/> Reference Uploaded</span> : <span className="flex items-center gap-2"><Upload className="w-4 h-4"/> Upload Style Reference</span>}</Button>
                     <Button onClick={handleGenerateAll} disabled={isGeneratingAll}>{isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{isGeneratingAll ? 'Generating...' : 'Generate All Images'}</Button>
                     <Button onClick={handleAddProduct}><Plus className="w-4 h-4" /> Add New Product</Button>
                   </div>
                </div>
                {referenceImage && (<div className="mb-6 p-4 bg-white border border-brand-200 rounded-xl flex items-center gap-4"><img src={referenceImage} alt="Ref" className="w-16 h-16 rounded object-cover border border-stone-200" /><div><p className="font-bold text-stone-800">Style Reference Active</p><p className="text-sm text-stone-500">New generations will match this packaging style.</p></div><button onClick={() => setReferenceImage(null)} className="ml-auto text-red-500 text-sm hover:underline">Remove</button></div>)}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                   <table className="w-full text-left text-sm"><thead className="bg-stone-50 text-stone-500 font-medium"><tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Price (100g)</th><th className="px-6 py-4 text-center">AI Image</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{products.map(p => (<tr key={p.id} className="hover:bg-stone-50"><td className="px-6 py-4 flex items-center gap-3"><img src={p.image} className="w-10 h-10 rounded object-cover bg-stone-200" alt="" /><div><div className="font-bold text-stone-800">{p.nameEn}</div><div className="text-xs text-stone-500">{p.nameHi}</div></div></td><td className="px-6 py-4 text-stone-600 capitalize">{p.category}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{p.stock} units</span></td><td className="px-6 py-4 font-medium">₹{p.price100g || 0}</td><td className="px-6 py-4 text-center"><button onClick={() => handleGenerateImage(p, referenceImage || undefined)} disabled={generatingFor === p.id || isGeneratingAll} className="p-2 rounded-full hover:bg-brand-50 text-brand-600 transition-colors disabled:opacity-50" title="Generate branded packaging">{generatingFor === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}</button></td><td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => handleEditProduct(p)} className="p-2 rounded-lg text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit Product"><Edit2 className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Product"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table>
                </div>
             </div>
          )}
          
           {activeTab === 'orders' && (
             <div className="space-y-6">
                <h1 className="text-2xl font-bold text-stone-800">Order Management</h1>
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 text-stone-500 font-medium">
                         <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                         {orders.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-stone-500">No orders found.</td></tr>
                         ) : orders.map(order => {
                            const customer = registeredUsers.find(u => u.id === order.userId);
                            return (
                               <tr key={order.id} className="hover:bg-stone-50">
                                  <td className="px-6 py-4 font-mono text-stone-600">{order.id}</td>
                                  <td className="px-6 py-4 font-medium text-stone-800">{customer ? customer.name : 'Guest/Unknown'}</td>
                                  <td className="px-6 py-4 text-stone-600">{new Date(order.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-bold">₹{order.total}</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                     }`}>
                                        {order.status}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4">
                                     <button className="text-brand-600 hover:underline">View</button>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'users' && (
             <div className="space-y-6">
                <h1 className="text-2xl font-bold text-stone-800">User Management</h1>
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 text-stone-500 font-medium">
                         <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Verified</th>
                            <th className="px-6 py-4">Total Orders</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                         {registeredUsers.map(user => {
                            const orderCount = orders.filter(o => o.userId === user.id).length;
                            return (
                               <tr key={user.id} className="hover:bg-stone-50">
                                  <td className="px-6 py-4">
                                     <div className="font-bold text-stone-800">{user.name}</div>
                                     <div className="text-xs text-stone-500">{user.email}</div>
                                  </td>
                                  <td className="px-6 py-4 capitalize">{user.role}</td>
                                  <td className="px-6 py-4">
                                     {user.isVerified ? <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-3 h-3"/> Verified</span> : <span className="text-stone-400 text-xs">Pending</span>}
                                  </td>
                                  <td className="px-6 py-4 font-medium">{orderCount}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button 
                                       onClick={() => setSelectedUser(user)}
                                       className="text-brand-600 hover:bg-brand-50 px-3 py-1 rounded-full text-xs font-bold border border-brand-200 transition-colors"
                                     >
                                       View Orders
                                     </button>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
       </main>
    </div>
  );
};

const LoginPage = ({ initialAdmin = false }: { initialAdmin?: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(initialAdmin);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const { registeredUsers, registerUser } = useDataStore();
  const navigate = useNavigate();

  // Reset states when switching modes
  useEffect(() => {
    setErrors({});
    setGlobalError(null);
    setEmail('');
    setPassword('');
    setName('');
    setMobile('');
    setShowPassword(false);
  }, [isLogin, isAdmin]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!isLogin) {
      if (!name.trim()) newErrors.name = 'Full Name is required';
      
      const cleanMobile = mobile.replace(/\D/g, '');
      if (!cleanMobile) newErrors.mobile = 'Mobile number is required';
      else if (cleanMobile.length !== 10) newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const truncated = rawValue.slice(0, 10);
    let formatted = truncated;
    if (truncated.length > 5) {
      formatted = `${truncated.slice(0, 5)} ${truncated.slice(5)}`;
    }
    setMobile(formatted);
    if (errors.mobile) setErrors({ ...errors, mobile: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) return;
    
    const normalizedEmail = email.toLowerCase().trim();
    const targetRole = isAdmin ? 'admin' : 'customer';

    if (isLogin) {
      const user = registeredUsers.find(
        u => u.email.toLowerCase() === normalizedEmail && u.role === targetRole
      );

      if (user) {
        login(user);
        navigate(isAdmin ? '/admin' : '/');
      } else {
        const existingUserAnyRole = registeredUsers.find(
          u => u.email.toLowerCase() === normalizedEmail
        );

        if (existingUserAnyRole) {
           setGlobalError(`Account found but it is a ${existingUserAnyRole.role} account. Please ${isAdmin ? 'uncheck' : 'check'} "Login as Admin".`);
        } else {
           setGlobalError('No account found with these credentials.');
        }
      }
    } else {
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        setGlobalError('An account with this email already exists. Please Sign In.');
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        mobile: mobile.replace(/\s/g, ''),
        role: targetRole,
        isVerified: true
      };

      try {
        registerUser(newUser);
        login(newUser);
        navigate(isAdmin ? '/admin' : '/');
      } catch (err) {
        console.error(err);
        setGlobalError('Failed to create account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-50">
      {/* Image Side (Desktop only) */}
      <div className="hidden lg:flex w-1/2 bg-brand-900 relative items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-30" 
          alt="Spices"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center text-white px-12 max-w-xl">
          <h1 className="text-6xl font-serif font-bold mb-6 tracking-tight">SpicePatrao</h1>
          <div className="w-24 h-1 bg-brand-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-brand-200 font-light leading-relaxed">Experience the true essence of Indian heritage. Authentic, hand-picked spices delivered straight from Kerala's finest farms to your kitchen.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 relative">
        <Link to="/" className="absolute top-8 right-8 p-2 text-stone-400 hover:text-stone-800 transition-colors">
           <X className="w-6 h-6" />
        </Link>
        
        <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-stone-100">
          <div className="text-center mb-8">
             <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">
               {isLogin ? 'Welcome Back' : 'Create Account'}
             </h2>
             <p className="text-stone-500">
                {isLogin ? 'Enter your details to sign in' : 'Join us for exclusive offers & recipes'}
             </p>
          </div>

          {globalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
             {!isLogin && (
               <>
                 <div className="space-y-1">
                   <div className="relative">
                     <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                     <input 
                       type="text" 
                       placeholder="Full Name" 
                       value={name} 
                       onChange={e => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); }}
                       className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-stone-200'}`} 
                     />
                   </div>
                   {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name}</p>}
                 </div>

                 <div className="space-y-1">
                   <div className="relative">
                     <Phone className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                     <input 
                       type="tel" 
                       placeholder="Mobile Number (e.g. 98765 43210)" 
                       value={mobile} 
                       onChange={handleMobileChange} 
                       className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.mobile ? 'border-red-300 focus:ring-red-200' : 'border-stone-200'}`} 
                     />
                   </div>
                   {errors.mobile && <p className="text-xs text-red-500 ml-1">{errors.mobile}</p>}
                 </div>
               </>
             )}

             <div className="space-y-1">
               <div className="relative">
                 <Mail className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                 <input 
                   type="email" 
                   placeholder="Email Address" 
                   value={email} 
                   onChange={e => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                   className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-stone-200'}`} 
                 />
               </div>
               {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
             </div>

             <div className="space-y-1">
               <div className="relative">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                 <input 
                   type={showPassword ? "text" : "password"}
                   placeholder="Password" 
                   value={password} 
                   onChange={e => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
                   className={`w-full pl-12 pr-12 py-3 border rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-stone-200'}`} 
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-stone-400 hover:text-stone-600 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
               {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
             </div>
             
             <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAdmin ? 'bg-brand-600 border-brand-600' : 'border-stone-300 group-hover:border-brand-400'}`}>
                    {isAdmin && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={isAdmin} 
                    onChange={e => setIsAdmin(e.target.checked)} 
                  />
                  <span className="text-sm text-stone-600 font-medium select-none">
                    {isLogin ? 'Login as Admin' : 'Register as Admin'}
                  </span>
                </label>
                {isLogin && <a href="#" className="text-xs font-bold text-brand-600 hover:text-brand-700">Forgot Password?</a>}
             </div>

             <Button type="submit" className="w-full justify-center text-lg py-3.5 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
               {isLogin ? 'Sign In' : 'Sign Up'}
             </Button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-stone-500 text-sm">
               {isLogin ? "Don't have an account?" : "Already have an account?"}
               <button 
                 type="button" 
                 onClick={() => setIsLogin(!isLogin)} 
                 className="ml-2 text-brand-600 font-bold hover:text-brand-700 hover:underline transition-all"
               >
                 {isLogin ? "Create Account" : "Sign In"}
               </button>
             </p>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100">
             <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center mb-4">Demo Credentials</p>
             <div className="flex justify-center gap-4 text-xs">
                <div className="bg-stone-50 px-3 py-2 rounded border border-stone-200 text-stone-600">
                  <span className="font-bold text-stone-800">Admin:</span> admin@spice.com
                </div>
                <div className="bg-stone-50 px-3 py-2 rounded border border-stone-200 text-stone-600">
                  <span className="font-bold text-stone-800">User:</span> user@example.com
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCartStore();
  const { products } = useDataStore();

  if (wishlist.length === 0) return <div className="text-center py-20"><Heart className="w-16 h-16 mx-auto text-stone-300 mb-4"/><h2 className="text-2xl font-serif">Wishlist Empty</h2><Link to="/products" className="text-brand-600 mt-4 inline-block">Start Shopping</Link></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">My Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map(id => {
          const p = products.find(prod => prod.id === id);
          if(!p) return null;
          return (
             <div key={id} className="bg-white rounded-xl shadow-sm border p-4">
                <img src={p.image} className="w-full h-48 object-cover rounded-lg mb-4" alt=""/>
                <h3 className="font-bold">{p.nameEn}</h3>
                <div className="flex justify-between items-center mt-4">
                   <PriceDisplay price={p.price100g} />
                   <div className="flex gap-2">
                      <button onClick={() => removeFromWishlist(id)} className="p-2 text-red-500 bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                      <button onClick={() => addToCart({productId: p.id, quantity: 1, weight: '100g'})} className="p-2 text-white bg-brand-600 rounded"><ShoppingBag className="w-4 h-4"/></button>
                   </div>
                </div>
             </div>
          )
        })}
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div>
      <div className="h-64 bg-stone-900 flex items-center justify-center text-white"><h1 className="text-5xl font-serif font-bold">Our Story</h1></div>
      <div className="max-w-3xl mx-auto px-4 py-16 prose prose-lg text-stone-600">
         <p>SpicePatrao began in 2018 with a simple mission: to bring the authentic taste of Indian spices to the world.</p>
         <p>We source directly from farmers in Kerala, ensuring fair trade and the highest quality.</p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage initialAdmin={true} />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;