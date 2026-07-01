import React from 'react';
import { Search, Package, AlertCircle, Clock, Truck, CheckCircle, XCircle, ArrowLeft, MapPin, User, Calendar } from 'lucide-react';
import type { Page } from '../types';
import { supabase } from '../lib/supabase';

interface TrackOrderPageProps {
  onNavigate: (page: Page) => void;
}

const statusConfig = {
  'Order Received': { icon: Package, color: 'text-gray-400', bg: 'bg-gray-600/30', border: 'border-gray-500/30' },
  'Processing': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-600/30', border: 'border-blue-500/30' },
  'Ready for Delivery': { icon: Truck, color: 'text-amber-400', bg: 'bg-amber-600/30', border: 'border-amber-500/30' },
  'Delivered': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-600/30', border: 'border-green-500/30' },
  'Cancelled': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-600/30', border: 'border-red-500/30' },
};

export function TrackOrderPage({ onNavigate }: TrackOrderPageProps) {
  const [orderId, setOrderId] = React.useState('');
  const [order, setOrder] = React.useState<{
    order_id: string;
    full_name: string;
    status: string;
    updated_at: string;
    department: string;
    year: string;
    phone_number: string;
    total_amount: number;
    cancelled_at: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('order_id, full_name, status, updated_at, department, year, phone_number, total_amount, cancelled_at')
        .eq('order_id', orderId.toUpperCase().trim())
        .single();

      if (fetchError || !data) {
        setError('Order not found. Please check your Order ID and try again.');
        return;
      }

      setOrder(data);
    } catch {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Order Received'];
    return config;
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Order</h1>
          <p className="text-gray-400">Enter your Order ID to check the current status</p>
        </div>

        {/* Search Form */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                placeholder="Enter Order ID (e.g., AK001)"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-gray-500 text-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Check Status
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/10 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Order Status */}
        {order && (
          <div className="glass rounded-2xl overflow-hidden border border-white/5">
            {/* Status Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-cyan-400" />
                  <span className="text-xl font-bold text-white">{order.order_id}</span>
                </div>
                <div className={`px-4 py-2 rounded-full ${getStatusIcon(order.status).bg} ${getStatusIcon(order.status).border} border flex items-center gap-2`}>
                  {React.createElement(getStatusIcon(order.status).icon, { className: `w-5 h-5 ${getStatusIcon(order.status).color}` })}
                  <span className={`font-medium ${getStatusIcon(order.status).color}`}>{order.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(order.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-6 bg-dark-900/50 border-b border-white/5">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-white font-medium">{order.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-white font-medium">{order.department}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="p-6 bg-dark-900/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Order Info</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-white">₹{order.total_amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-white font-medium">Cash on Delivery</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 glass rounded-xl p-4 border border-blue-500/20">
          <p className="text-blue-400 text-sm text-center">
            Can't find your order? Check the Order ID from your confirmation email or contact us at WhatsApp: 9074964672
          </p>
        </div>
      </div>
    </div>
  );
}
