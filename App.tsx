import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, Heart, User as UserIcon, Menu, X, Search, Star, Truck, ShieldCheck, Leaf, ArrowRight, Minus, Plus, Trash2, Home, Package, BarChart3, Users, LogOut, CheckCircle, ChevronDown, Filter, Sparkles, Loader2, Upload, Zap, Mail, Phone, MapPin, Calendar, Lock, AlertCircle, TrendingUp, DollarSign, ShoppingCart, Percent, Edit2, Save, Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { GoogleGenAI } from "@google/genai";

import { useAuthStore, useCartStore, useDataStore } from './store';
import { Product, CartItem, Order, User } from './types';
import { SPICE_DATA } from './data';

// --- Utility Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg",
    secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
    outline: "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
    ghost: "text-stone-600 hover:bg-stone-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};

const PriceDisplay = ({ price, size = 'md' }: { price: number, size?: 'sm'|'md'|'lg' }) => {
  const sizeClass = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  return <span className={`font-serif font-bold text-brand-800 ${sizeClass[size]}`}>₹{price}</span>;
};

// --- Modal Component ---
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
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
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
                <input name="nameEn" value={formData.nameEn} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="e.g. Turmeric" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Hindi Name</label>
                <input name="nameHi" value={formData.nameHi} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="e.g. Haldi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (100g)</label>
                  <input type="number" name="price100g" value={formData.price100g} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (1kg)</label>
                  <input type="number" name="price1kg" value={formData.price1kg} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Stock Quantity</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
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
                   <input type="text" name="image" value={formData.image} onChange={handleChange} className="w-full p-2 border rounded-lg text-xs text-stone-500" placeholder="Or paste image URL" />
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
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 border rounded-lg" placeholder="Describe the spice..." />
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(formData)}><Save className="w-4 h-4" /> Save Product</Button>
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
                  <div className="absolute right-0 w-48 bg-white shadow-xl rounded-xl py-2 hidden group-hover:block border border-stone-100 mt-2">
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

// --- Component: Product Card Skeleton ---

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-square bg-stone-200 animate-pulse"></div>
      
      {/* Content Skeleton */}
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

// --- Component: Product Card ---

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useCartStore();
  const [selectedWeight, setSelectedWeight] = useState<'100g' | '1kg'>('100g');
  
  const isWishlisted = wishlist.includes(product.id);
  const currentPrice = selectedWeight === '100g' ? product.price100g : product.price1kg;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ productId: product.id, quantity: 1, weight: selectedWeight });
    // In a real app, show a toast here
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
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
        
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm z-10"
        >
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

        {/* Weight Toggle */}
        <div className="mt-auto pt-2">
          <div className="flex bg-stone-100 rounded-lg p-1 w-full text-xs font-medium mb-3">
             <button 
               onClick={(e) => handleWeightToggle(e, '100g')}
               className={`flex-1 py-1 rounded-md transition-all ${selectedWeight === '100g' ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
               100g
             </button>
             <button 
               onClick={(e) => handleWeightToggle(e, '1kg')}
               className={`flex-1 py-1 rounded-md transition-all ${selectedWeight === '1kg' ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
               1kg
             </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
               <span className="text-xs text-stone-400">Price</span>
               <div className="flex items-baseline gap-1">
                 <PriceDisplay price={currentPrice} size="md" />
               </div>
            </div>
            <button 
               onClick={handleAddToCart}
               disabled={product.stock === 0}
               className="h-9 px-4 rounded-lg bg-brand-600 text-white font-medium text-sm flex items-center justify-center hover:bg-brand-700 transition-colors gap-2"
            >
               <ShoppingBag className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- Page: Home ---

const HomePage = () => {
  const { products } = useDataStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'whole' | 'powder' | 'blend'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state for Home Page
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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const matches = products.filter(p => 
        p.nameEn.toLowerCase().includes(query.toLowerCase()) || 
        p.nameHi.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchQuery.trim()) {
       navigate('/products', { state: { search: searchQuery } });
    }
  };

  const filteredProducts = products.filter(p => activeCategory === 'all' || p.category === activeCategory);
  
  const categories = [
    { id: 'all', label: 'All Spices' },
    { id: 'whole', label: 'Whole Spices' },
    { id: 'powder', label: 'Powders' },
    { id: 'blend', label: 'Masala Blends' },
  ];

  return (
    <div className="bg-brand-50 min-h-screen">
      {/* Hero */}
      <div className="relative bg-stone-900 h-[650px] flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Spices" />
        <div className="relative z-10 text-center px-4 flex flex-col items-center max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-serif text-brand-300 font-medium mb-3 tracking-[0.2em] uppercase drop-shadow-md">SpicePatrao</h2>
          <h1 className="text-5xl md:text-8xl font-serif text-white font-bold mb-6 drop-shadow-xl leading-none">
            Pure Spices.<br/>Honest Flavour.
          </h1>
          <p className="text-lg md:text-2xl text-stone-200 mb-8 font-light max-w-2xl leading-relaxed">
            Hand-picked from the finest farms in Kerala. Stone-ground to preserve the soul of India.
          </p>

          {/* Search Bar with Autocomplete */}
          <div className="w-full max-w-lg relative mb-8" ref={searchRef}>
             <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text" 
                  placeholder="Find your flavor (e.g., Turmeric, Haldi)..." 
                  className="w-full px-6 py-4 rounded-full text-stone-800 focus:outline-none focus:ring-4 focus:ring-brand-500/50 shadow-2xl text-lg pl-12"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-6 h-6" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 transition">
                   <ArrowRight className="w-5 h-5" />
                </button>
             </form>

             {/* Autocomplete Dropdown */}
             {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden text-left z-20">
                   {suggestions.map(product => (
                      <Link 
                         key={product.id} 
                         to={`/product/${product.id}`}
                         className="flex items-center gap-4 p-3 hover:bg-stone-50 transition border-b border-stone-50 last:border-0"
                      >
                         <img src={product.image} alt={product.nameEn} className="w-10 h-10 rounded-md object-cover" />
                         <div>
                            <div className="font-bold text-stone-800">{product.nameEn}</div>
                            <div className="text-xs text-brand-600 font-medium">{product.nameHi}</div>
                         </div>
                      </Link>
                   ))}
                </div>
             )}
          </div>

          <Link to="/products">
            <Button size="lg" className="text-lg px-12 py-3 shadow-2xl bg-white/10 backdrop-blur-md hover:bg-white hover:text-brand-800 border-2 border-white/30 text-white rounded-full transition-all">
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="py-16 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center group">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><Leaf className="w-10 h-10" /></div>
            <h3 className="text-xl font-serif font-bold text-stone-800">100% Natural</h3>
            <p className="text-stone-500 mt-3 leading-relaxed">Sourced directly from organic farms. No preservatives, no additives, just pure nature.</p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><ShieldCheck className="w-10 h-10" /></div>
            <h3 className="text-xl font-serif font-bold text-stone-800">Freshly Packed</h3>
            <p className="text-stone-500 mt-3 leading-relaxed">Ground in small batches and vacuum sealed immediately to lock in the essential oils.</p>
          </div>
          <div className="flex flex-col items-center group">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300"><Truck className="w-10 h-10" /></div>
            <h3 className="text-xl font-serif font-bold text-stone-800">Pan-India Delivery</h3>
            <p className="text-stone-500 mt-3 leading-relaxed">From Kashmir to Kanyakumari, we deliver authentic flavors to 25,000+ pin codes.</p>
          </div>
        </div>
      </div>

      {/* Categories & Product Listing */}
      <div className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-stone-800 mb-4">Our Collection</h2>
          <div className="w-24 h-1 bg-brand-600 mx-auto rounded-full"></div>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-lg transform scale-105'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-300 hover:text-brand-600 hover:shadow-md'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
             filteredProducts.map(product => (
               <ProductCard key={product.id} product={product} />
             ))
          )}
        </div>
        
        {!isLoading && filteredProducts.length === 0 && (
           <div className="text-center py-20 text-stone-500 bg-white rounded-xl border border-stone-100">
             <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No products found in this category.</p>
           </div>
        )}
        
        <div className="mt-16 text-center">
           <Link to="/products">
             <Button variant="outline" className="px-8 py-3 rounded-full">
               View Full Catalog <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
        </div>
      </div>
      
      {/* Banner */}
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
  // Initialize search from location state if available
  const [search, setSearch] = useState(location.state?.search || '');
  const [isLoading, setIsLoading] = useState(true);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle click outside for suggestions
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    
    if (val.length > 1) {
      const matches = products.filter(p => 
        p.nameEn.toLowerCase().includes(val.toLowerCase()) || 
        p.nameHi.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
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
      return 0; // featured
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        {/* Search Bar with Autocomplete */}
        <div className="relative w-full md:w-96" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search for spices (e.g. Cumin, Jeera)..." 
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={search}
                onChange={handleSearchInput}
                onFocus={() => search.length > 1 && setShowSuggestions(true)}
            />
          </div>
          
          {/* Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-stone-100 z-50 overflow-hidden">
                {suggestions.map(p => (
                    <Link 
                        to={`/product/${p.id}`} 
                        key={p.id}
                        className="flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
                    >
                        <img src={p.image} alt={p.nameEn} className="w-10 h-10 rounded object-cover" />
                        <div>
                            <div className="font-bold text-stone-800 text-sm">{p.nameEn}</div>
                            <div className="text-xs text-brand-600">{p.nameHi}</div>
                        </div>
                    </Link>
                ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)} 
            className="px-4 py-2 border border-stone-200 rounded-lg bg-white"
          >
            <option value="all">All Types</option>
            <option value="whole">Whole Spices</option>
            <option value="powder">Powders</option>
          </select>
          <select 
             value={sort}
             onChange={(e) => setSort(e.target.value)}
             className="px-4 py-2 border border-stone-200 rounded-lg bg-white"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">New Arrivals</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <p className="text-xl">No spices found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
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
    if (w === '500g') return product.price1kg / 2 * 1.05; // slight premium for smaller packs
    if (w === '250g') return product.price100g * 2.5 * 0.95; // bulk discount vs 100g
    return product.price100g;
  };

  const currentPrice = Math.round(getPrice(weight));
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
             <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm">
                <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" />
             </div>
          </div>

          {/* Details */}
          <div>
             <div className="mb-6">
                <h1 className="text-4xl font-serif font-bold text-stone-800">{product.nameEn}</h1>
                <h2 className="text-2xl font-serif text-brand-600 mt-1">{product.nameHi}</h2>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-stone-300'}`} />)}
                   </div>
                   <span className="text-sm text-stone-500">{product.reviews} Reviews</span>
                   <span className={`text-sm font-bold px-2 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                   </span>
                </div>
             </div>

             <p className="text-stone-600 leading-relaxed mb-6">{product.description}</p>

             <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-stone-600">Pack Weight</span>
                   <div className="flex gap-2">
                      {['100g', '250g', '500g', '1kg'].map((w) => (
                         <button 
                           key={w}
                           onClick={() => setWeight(w as any)}
                           className={`px-3 py-1 text-sm rounded border ${weight === w ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-stone-600 border-stone-300 hover:border-brand-500'}`}
                         >
                           {w}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                   <div>
                      <PriceDisplay price={currentPrice} size="lg" />
                      <span className="text-stone-400 text-sm ml-2">Inclusive of all taxes</span>
                   </div>
                   <div className="flex items-center gap-3 border border-stone-300 rounded-lg px-2 py-1">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 hover:text-brand-600"><Minus className="w-4 h-4" /></button>
                      <span className="font-medium w-8 text-center">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="p-1 hover:text-brand-600"><Plus className="w-4 h-4" /></button>
                   </div>
                </div>

                <div className="flex gap-4">
                   <Button onClick={() => addToCart({ productId: product.id, quantity: qty, weight })} className="flex-1 py-3" disabled={product.stock === 0}>
                      <ShoppingBag className="w-5 h-5" /> Add to Cart
                   </Button>
                   <button 
                      onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id)}
                      className={`p-3 border rounded-lg transition-colors ${isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-stone-300 text-stone-400 hover:border-brand-500 hover:text-brand-500'}`}
                   >
                      <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                   </button>
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
                      <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                         <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <h3 className="font-bold text-stone-800">{product.nameEn}</h3>
                               <p className="text-sm text-stone-500">{item.weight} pack</p>
                            </div>
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
                <div className="mt-4 text-center text-xs text-stone-400 flex items-center justify-center gap-1">
                   <ShieldCheck className="w-3 h-3" /> Secure Payment
                </div>
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
        total: items.length * 100, // mock total logic
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
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
              <CheckCircle className="w-10 h-10" />
           </div>
           <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">Order Confirmed!</h1>
           <p className="text-stone-500 mb-8 max-w-md">Thank you for shopping with SpicePatrao. Your aromatic spices will be packed with care and shipped shortly.</p>
           <div className="flex gap-4">
              <Link to="/"><Button variant="outline">Back Home</Button></Link>
              <Link to="/profile"><Button>View Order</Button></Link>
           </div>
        </div>
     );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
       <h1 className="text-2xl font-serif font-bold mb-6">Checkout</h1>
       <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          {/* Step 1 */}
          <div className="p-6 border-b border-stone-100">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm">1</div> Shipping Address</h2>
             {step === 1 && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="First Name" className="border p-2 rounded w-full" defaultValue={user?.name?.split(' ')[0]} />
                      <input type="text" placeholder="Last Name" className="border p-2 rounded w-full" />
                   </div>
                   <input type="text" placeholder="Address Line 1" className="border p-2 rounded w-full" />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="City" className="border p-2 rounded w-full" />
                      <input type="text" placeholder="Pincode" className="border p-2 rounded w-full" />
                   </div>
                   <Button onClick={() => setStep(2)} className="mt-4">Continue to Payment</Button>
                </div>
             )}
          </div>
          
          {/* Step 2 */}
          <div className="p-6">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-brand-100 text-brand-600' : 'bg-stone-100 text-stone-400'}`}>2</div> Payment Method</h2>
             {step === 2 && (
                <div className="space-y-4">
                   <div className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-brand-500 bg-brand-50 border-brand-200">
                      <div className="w-4 h-4 rounded-full border border-brand-600 bg-brand-600"></div>
                      <span className="font-medium">UPI (Google Pay / PhonePe)</span>
                   </div>
                   <div className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-brand-500 opacity-60">
                      <div className="w-4 h-4 rounded-full border border-stone-400"></div>
                      <span className="font-medium">Credit / Debit Card</span>
                   </div>
                   <Button onClick={handlePlaceOrder} className="w-full mt-6 py-3">Place Order</Button>
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
  const { products, orders, updateProduct, addProduct, deleteProduct } = useDataStore();
  const [activeTab, setActiveTab] = useState<'analytics'|'products'|'orders'>('analytics');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const revenueData = [
     { name: 'Mon', revenue: 4000 },
     { name: 'Tue', revenue: 3000 },
     { name: 'Wed', revenue: 2000 },
     { name: 'Thu', revenue: 2780 },
     { name: 'Fri', revenue: 1890 },
     { name: 'Sat', revenue: 2390 },
     { name: 'Sun', revenue: 3490 },
  ];

  const ordersData = [
    { name: 'Mon', orders: 24 },
    { name: 'Tue', orders: 13 },
    { name: 'Wed', orders: 98 },
    { name: 'Thu', orders: 39 },
    { name: 'Fri', orders: 48 },
    { name: 'Sat', orders: 38 },
    { name: 'Sun', orders: 43 },
  ];

  const topSelling = products.filter(p => p.isTopSeller).slice(0, 5);
  const COLORS = ['#b9663b', '#c58149', '#d09f6e', '#dec09b', '#eadbc3'];

  return (
    <div className="flex h-screen bg-stone-50">
       <ProductModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         product={editingProduct} 
         onSave={handleSaveProduct} 
       />

       <aside className="w-64 bg-stone-900 text-white hidden md:flex flex-col">
          <div className="p-6 text-2xl font-serif font-bold text-brand-400">SpicePatrao<span className="text-xs block font-sans text-stone-500 font-normal">Admin Panel</span></div>
          <nav className="flex-1 px-4 space-y-2">
             <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'analytics' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}>
                <BarChart3 className="w-5 h-5" /> Analytics
             </button>
             <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'products' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}>
                <Package className="w-5 h-5" /> Products
             </button>
             <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg ${activeTab === 'orders' ? 'bg-brand-800 text-white' : 'text-stone-400 hover:bg-stone-800'}`}>
                <Users className="w-5 h-5" /> Orders
             </button>
          </nav>
          <div className="p-4 border-t border-stone-800">
             <Link to="/" className="flex items-center gap-2 text-stone-400 hover:text-white"><Home className="w-4 h-4"/> Back to Store</Link>
          </div>
       </aside>

       <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'analytics' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                   <h1 className="text-2xl font-bold text-stone-800">Analytics Dashboard</h1>
                   <div className="text-sm text-stone-500 bg-white px-3 py-1 rounded-md border shadow-sm">
                      Last 7 Days
                   </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                      <div>
                         <div className="text-stone-500 text-sm mb-1 font-medium">Total Revenue</div>
                         <div className="text-3xl font-bold text-stone-800">₹{totalRevenue.toLocaleString()}</div>
                         <div className="text-green-600 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12.5% vs last week</div>
                      </div>
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                         <DollarSign className="w-6 h-6" />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                      <div>
                         <div className="text-stone-500 text-sm mb-1 font-medium">Total Orders</div>
                         <div className="text-3xl font-bold text-stone-800">{totalOrders}</div>
                         <div className="text-green-600 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +8.2% vs last week</div>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                         <ShoppingCart className="w-6 h-6" />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                      <div>
                         <div className="text-stone-500 text-sm mb-1 font-medium">Conversion Rate</div>
                         <div className="text-3xl font-bold text-stone-800">{conversionRate}%</div>
                         <div className="text-red-500 text-xs mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 rotate-180"/> -1.1% vs last week</div>
                      </div>
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                         <Percent className="w-6 h-6" />
                      </div>
                   </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-80">
                      <h3 className="font-bold text-lg mb-6 text-stone-800">Revenue Over Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#b9663b" strokeWidth={3} dot={{ fill: '#b9663b', r: 4 }} activeDot={{ r: 6 }} />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                   
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-80">
                      <h3 className="font-bold text-lg mb-6 text-stone-800">Orders Over Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={ordersData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                               cursor={{fill: '#f5efe4'}}
                            />
                            <Bar dataKey="orders" fill="#d09f6e" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Top Selling Spices */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                    <h3 className="font-bold text-lg mb-6 text-stone-800">Top Selling Spices</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 text-stone-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-lg">Product</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Sales</th>
                                    <th className="px-6 py-4 text-right rounded-r-lg">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {topSelling.map((p, index) => (
                                    <tr key={p.id} className="hover:bg-stone-50">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="font-bold text-stone-400 w-4">#{index + 1}</div>
                                            <img src={p.image} className="w-10 h-10 rounded-md object-cover bg-stone-200" alt="" />
                                            <div>
                                                <div className="font-bold text-stone-800">{p.nameEn}</div>
                                                <div className="text-xs text-stone-500">{p.nameHi}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-stone-600">{p.category}</td>
                                        <td className="px-6 py-4 text-right font-medium">{150 - (index * 20)} orders</td>
                                        <td className="px-6 py-4 text-right font-bold text-stone-800">₹{(p.price100g * (150 - (index * 20))).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'products' && (
             <div>
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-2xl font-bold text-stone-800">Products Inventory</h1>
                   <div className="flex gap-4">
                     <Button variant="outline" className="relative overflow-hidden">
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={handleImageUpload} 
                         className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                       {referenceImage ? <span className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4"/> Reference Uploaded</span> : <span className="flex items-center gap-2"><Upload className="w-4 h-4"/> Upload Style Reference</span>}
                     </Button>
                     <Button onClick={handleGenerateAll} disabled={isGeneratingAll}>
                       {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                       {isGeneratingAll ? 'Generating...' : 'Generate All Images'}
                     </Button>
                     <Button onClick={handleAddProduct}><Plus className="w-4 h-4" /> Add New Product</Button>
                   </div>
                </div>
                
                {referenceImage && (
                    <div className="mb-6 p-4 bg-white border border-brand-200 rounded-xl flex items-center gap-4">
                        <img src={referenceImage} alt="Ref" className="w-16 h-16 rounded object-cover border border-stone-200" />
                        <div>
                            <p className="font-bold text-stone-800">Style Reference Active</p>
                            <p className="text-sm text-stone-500">New generations will match this packaging style.</p>
                        </div>
                        <button onClick={() => setReferenceImage(null)} className="ml-auto text-red-500 text-sm hover:underline">Remove</button>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 text-stone-500 font-medium">
                         <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Price (100g)</th>
                            <th className="px-6 py-4 text-center">AI Image</th>
                            <th className="px-6 py-4">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                         {products.map(p => (
                            <tr key={p.id} className="hover:bg-stone-50">
                               <td className="px-6 py-4 flex items-center gap-3">
                                  <img src={p.image} className="w-10 h-10 rounded object-cover bg-stone-200" alt="" />
                                  <div>
                                     <div className="font-bold text-stone-800">{p.nameEn}</div>
                                     <div className="text-xs text-stone-500">{p.nameHi}</div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-stone-600 capitalize">{p.category}</td>
                               <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                     {p.stock} units
                                  </span>
                               </td>
                               <td className="px-6 py-4 font-medium">₹{p.price100g}</td>
                               <td className="px-6 py-4 text-center">
                                  <button 
                                     onClick={() => handleGenerateImage(p, referenceImage || undefined)}
                                     disabled={generatingFor === p.id || isGeneratingAll}
                                     className="p-2 rounded-full hover:bg-brand-50 text-brand-600 transition-colors disabled:opacity-50"
                                     title="Generate branded packaging"
                                  >
                                     {generatingFor === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                  </button>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleEditProduct(p)}
                                      className="p-2 rounded-lg text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                      title="Edit Product"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProduct(p.id)}
                                      className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
          
           {activeTab === 'orders' && (
             <div className="text-center py-20 text-stone-500">
                <p>Order management module placeholder.</p>
                <p className="text-sm">Connects to backend API for live updates.</p>
             </div>
          )}
       </main>
    </div>
  );
};

// --- Component: Footer ---
const Footer = () => (
  <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      <div>
        <div className="text-2xl font-serif font-bold text-white mb-4">SpicePatrao</div>
        <p className="mb-4">Bringing the authentic flavors of Indian heritage to your kitchen since 2018.</p>
        <div className="flex gap-4">
           <a href="#" className="hover:text-brand-500"><AlertCircle className="w-5 h-5"/></a>
           <a href="#" className="hover:text-brand-500"><Mail className="w-5 h-5"/></a>
           <a href="#" className="hover:text-brand-500"><Phone className="w-5 h-5"/></a>
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Shop</h4>
        <ul className="space-y-2">
          <li><Link to="/products" className="hover:text-brand-500">All Spices</Link></li>
          <li><Link to="/products" className="hover:text-brand-500">Whole Spices</Link></li>
          <li><Link to="/products" className="hover:text-brand-500">Powders</Link></li>
          <li><Link to="/products" className="hover:text-brand-500">Blends</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Company</h4>
        <ul className="space-y-2">
          <li><Link to="/about" className="hover:text-brand-500">About Us</Link></li>
          <li><Link to="/" className="hover:text-brand-500">Contact</Link></li>
          <li><Link to="/" className="hover:text-brand-500">Shipping Policy</Link></li>
          <li><Link to="/admin/login" className="hover:text-brand-500">Admin Login</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Newsletter</h4>
        <p className="mb-4 text-sm">Subscribe to get special offers and recipes.</p>
        <div className="flex">
          <input type="email" placeholder="Email address" className="bg-stone-800 border-none rounded-l-lg px-4 py-2 w-full focus:ring-1 focus:ring-brand-500" />
          <button className="bg-brand-600 text-white px-4 py-2 rounded-r-lg hover:bg-brand-700">Go</button>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-stone-800 text-center text-sm">
       &copy; {new Date().getFullYear()} SpicePatrao. All rights reserved.
    </div>
  </footer>
);

// --- Component: Layout ---
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isStandalone = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <div className="flex flex-col min-h-screen font-sans text-stone-600">
      {!isStandalone && <Navbar />}
      <main className={`flex-1 ${!isStandalone ? 'bg-stone-50' : ''}`}>
        {children}
      </main>
      {!isStandalone && <Footer />}
    </div>
  );
};

// --- Page: Login ---
const LoginPage = ({ initialAdmin = false }: { initialAdmin?: boolean }) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { registeredUsers, registerUser } = useDataStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
       const user = registeredUsers.find(u => u.email === formData.email);
       // Simple mock auth
       if (user) {
         if (initialAdmin && user.role !== 'admin') {
            setError("Access denied. Admin privileges required.");
            return;
         }
         login(user);
         navigate(initialAdmin ? '/admin' : '/');
       } else {
         setError("User not found.");
       }
    } else {
       const newUser: User = {
          id: `user-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          role: 'customer',
          isVerified: true
       };
       registerUser(newUser);
       login(newUser);
       navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-brand-50">
       <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-100">
          <div className="text-center mb-8">
             <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">{initialAdmin ? 'Admin Portal' : (isLogin ? 'Welcome Back' : 'Join Us')}</h1>
             <p className="text-stone-500">{initialAdmin ? 'Please login to manage the store' : (isLogin ? 'Sign in to access your account' : 'Create an account to start shopping')}</p>
          </div>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
             {!isLogin && (
                <div>
                   <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                   <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
             )}
             <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                <input 
                   type="email" 
                   required 
                   className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <input 
                   type="password" 
                   required 
                   className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                   value={formData.password}
                   onChange={e => setFormData({...formData, password: e.target.value})}
                />
             </div>
             
             <Button className="w-full py-3 mt-2">{isLogin ? 'Sign In' : 'Create Account'}</Button>
          </form>
          
          {!initialAdmin && (
             <div className="mt-6 text-center text-sm">
                <button onClick={() => setIsLogin(!isLogin)} className="text-brand-600 hover:underline font-medium">
                   {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
             </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
             {!initialAdmin && <p>Demo credentials: user@example.com / any password</p>}
             {initialAdmin && <p>Demo credentials: admin@spice.com / any password</p>}
          </div>
       </div>
    </div>
  );
};

// --- Page: Wishlist ---
const WishlistPage = () => {
  const { wishlist } = useCartStore();
  const { products } = useDataStore();
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
       <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-brand-600 fill-brand-600" />
          <h1 className="text-3xl font-serif font-bold text-stone-800">My Wishlist</h1>
       </div>
       
       {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-stone-200 shadow-sm">
             <Heart className="w-16 h-16 mx-auto text-stone-200 mb-4" />
             <p className="text-lg text-stone-500 mb-6">Your wishlist is empty.</p>
             <Link to="/products"><Button>Explore Spices</Button></Link>
          </div>
       ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
       )}
    </div>
  );
};

// --- Page: About ---
const AboutPage = () => {
  return (
    <div className="bg-white">
       {/* Hero */}
       <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Spices" />
          <div className="absolute inset-0 bg-stone-900/60"></div>
          <div className="relative z-10 text-center max-w-2xl px-4">
             <h1 className="text-5xl font-serif font-bold text-white mb-6">Our Story</h1>
             <p className="text-xl text-stone-200 leading-relaxed">A journey from the sun-drenched farms of Kerala to your kitchen shelf.</p>
          </div>
       </div>
       
       <div className="max-w-4xl mx-auto px-4 py-20 space-y-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
             <div className="flex-1">
                <h2 className="text-3xl font-serif font-bold text-stone-800 mb-6">The SpicePatrao Promise</h2>
                <p className="text-stone-600 leading-relaxed mb-4">Founded in 2018, SpicePatrao began with a simple mission: to bring authentic, unadulterated spices back to Indian kitchens. We noticed that store-bought masala often lacked the punch and aroma of what our grandmothers used.</p>
                <p className="text-stone-600 leading-relaxed">So we went straight to the source. We partner directly with small-scale farmers in Kerala, Karnataka, and Rajasthan who practice sustainable agriculture.</p>
             </div>
             <div className="flex-1">
                <img src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=800&auto=format&fit=crop" className="rounded-2xl shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500" alt="Farmer" />
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
             <div className="flex-1">
                <h2 className="text-3xl font-serif font-bold text-stone-800 mb-6">Traditional Stone Grinding</h2>
                <p className="text-stone-600 leading-relaxed mb-4">Unlike modern industrial pulverizers that generate high heat and kill the essential oils, we use slow-speed stone grinding (chakki) techniques. This ensures that the volatile oils—the soul of the spice—remain intact.</p>
                <p className="text-stone-600 leading-relaxed">The result? A pinch of SpicePatrao turmeric is more potent than a spoonful of the other brands.</p>
             </div>
             <div className="flex-1">
                <img src="https://images.unsplash.com/photo-1599579165376-749e79435b62?q=80&w=800&auto=format&fit=crop" className="rounded-2xl shadow-xl -rotate-2 hover:rotate-0 transition-transform duration-500" alt="Spices" />
             </div>
          </div>
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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;