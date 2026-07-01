import React from 'react';
import { Minus, Plus, ArrowRight, ArrowLeft, ShoppingBag, Ruler, AlertCircle } from 'lucide-react';
import type { Page, Product } from '../types';
import { supabase } from '../lib/supabase';

interface ProductsPageProps {
  cartItems: { productId: string; quantity: number }[];
  onUpdateCart: (items: { productId: string; quantity: number }[]) => void;
  onNavigate: (page: Page) => void;
}

export function ProductsPage({ cartItems, onUpdateCart, onNavigate }: ProductsPageProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setProducts(data || []);

      if (data) {
        const existingIds = cartItems.map((item) => item.productId);
        const newItems = data
          .filter((p) => !existingIds.includes(p.id))
          .map((p) => ({ productId: p.id, quantity: 0 }));
        if (newItems.length > 0 && cartItems.length === 0) {
          onUpdateCart(newItems);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProductQuantity = (productId: string): number => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.quantity || 0;
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const currentQty = getProductQuantity(productId);
    const newQty = Math.max(0, Math.min(currentQty + delta, product?.stock || 0));

    const newItems = cartItems.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateCart(newItems);
  };

  const getTotalAmount = (): number => {
    return cartItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getTotalItems = (): number => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleContinue = () => {
    if (getTotalItems() > 0) {
      onNavigate('order-review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0a298a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center glass rounded-2xl p-8 max-w-md border border-white/5">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-3 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-medium hover:opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('student-details')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Select Products</h1>
          <p className="text-gray-400">Choose the uniform cloth items you need</p>
        </div>

        <div className="mb-6 p-4 glass rounded-xl border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">Important:</span> Cloth material only. Stitching is not included. Cash on Delivery available.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {products.map((product) => {
            const isOutOfStock = !product.stock || product.stock === 0;
            const quantity = getProductQuantity(product.id);

            return (
              <div
                key={product.id}
                className={`glass rounded-2xl overflow-hidden transition-all border border-white/5 ${isOutOfStock ? 'opacity-60' : 'hover:shadow-lg'
                  }`}
              >
                <div className="aspect-square bg-dark-900 relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
                      <div className="text-center">
                        <Ruler className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Product Image</p>
                      </div>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.meters_per_unit} Meters per Unit</p>
                  <p className="text-gray-400 text-sm mb-4">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-white">₹{product.price}</span>
                      <span className="text-gray-500 text-sm ml-1">/ unit</span>
                    </div>
                    <span className={`text-sm ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between glass rounded-xl p-3 border border-white/5 ${isOutOfStock ? 'pointer-events-none' : ''}`}>
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={quantity === 0 || isOutOfStock}
                      className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-300" />
                    </button>

                    <span className="text-xl font-semibold text-white min-w-[3rem] text-center">
                      {quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={isOutOfStock || quantity >= product.stock}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0a298a] to-[#1a55f2] flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-6 sticky bottom-4 border border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-3xl font-bold text-white">₹{getTotalAmount()}</p>
              {getTotalItems() > 0 && (
                <p className="text-sm text-gray-500">{getTotalItems()} item(s) selected</p>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={getTotalItems() === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${getTotalItems() > 0
                ? 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white hover:opacity-90 transform hover:scale-[1.02]'
                : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                }`}
            >
              <ShoppingBag className="w-5 h-5" />
              Review Order
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
