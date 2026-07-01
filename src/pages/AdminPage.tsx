import React from 'react';
import {
  Package,
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  AlertCircle,
  Check,
  Clock,
  Truck,
  ShoppingBag,
  Image as ImageIcon,
  LogOut,
  Download,
  DollarSign,
  TrendingUp,
  Bell,
  Edit3,
  Save,
  X,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { Page, Order, Product } from '../types';
import { supabase } from '../lib/supabase';

interface AdminPageProps {
  onLogout: () => void;
  onNavigate?: (page: Page) => void;
}

const orderStatuses = [
  { value: 'Order Received', label: 'Order Received', icon: ShoppingBag, color: 'text-gray-400 bg-gray-600/30 border-gray-500/30' },
  { value: 'Processing', label: 'Processing', icon: Clock, color: 'text-blue-400 bg-blue-600/30 border-blue-500/30' },
  { value: 'Ready for Delivery', label: 'Ready for Delivery', icon: Package, color: 'text-amber-400 bg-amber-600/30 border-amber-500/30' },
  { value: 'Delivered', label: 'Delivered', icon: Truck, color: 'text-green-400 bg-green-600/30 border-green-500/30' },
];

export function AdminPage({ onLogout }: AdminPageProps) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedOrder, setExpandedOrder] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'products' | 'stats' | 'settings'>('orders');
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null);
  const [editPrice, setEditPrice] = React.useState('');
  const [editStock, setEditStock] = React.useState('');
  const [newOrdersCount, setNewOrdersCount] = React.useState(0);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = React.useState('');
  const [savingSheetsUrl, setSavingSheetsUrl] = React.useState(false);
  const [showClearOrdersConfirm, setShowClearOrdersConfirm] = React.useState(false);
  const [clearingOrders, setClearingOrders] = React.useState(false);

  React.useEffect(() => {
    fetchData();
    fetchLogo();
    fetchSettings();
    const interval = setInterval(fetchNewOrdersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['logo_url', 'google_sheets_webhook_url']);

      if (!error && data) {
        data.forEach((item: { setting_key: string; setting_value: string | null }) => {
          if (item.setting_key === 'google_sheets_webhook_url' && item.setting_value) {
            setGoogleSheetsUrl(item.setting_value);
          }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSaveGoogleSheetsUrl = async () => {
    setSavingSheetsUrl(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { setting_key: 'google_sheets_webhook_url', setting_value: googleSheetsUrl || null },
          { onConflict: 'setting_key' }
        );

      if (error) throw error;
      showMessage('success', 'Google Sheets integration saved');
    } catch (err) {
      console.error('Error saving Google Sheets URL:', err);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSavingSheetsUrl(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'logo_url')
        .single();

      if (!error && data?.setting_value) {
        setLogoUrl(data.setting_value);
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `site/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('site_settings')
        .upsert(
          { setting_key: 'logo_url', setting_value: urlData.publicUrl },
          { onConflict: 'setting_key' }
        );

      if (updateError) throw updateError;

      setLogoUrl(urlData.publicUrl);
      showMessage('success', 'Logo uploaded successfully');
    } catch (err) {
      console.error('Error uploading logo:', err);
      showMessage('error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: null })
        .eq('setting_key', 'logo_url');

      if (error) throw error;
      setLogoUrl(null);
      showMessage('success', 'Logo removed');
    } catch (err) {
      console.error('Error removing logo:', err);
      showMessage('error', 'Failed to remove logo');
    }
  };

  const handleClearAllOrders = async () => {
    setClearingOrders(true);
    try {
      // First delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (itemsError) throw itemsError;

      // Then delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (ordersError) throw ordersError;

      // Refresh data
      await fetchData();
      setShowClearOrdersConfirm(false);
      showMessage('success', 'All orders have been cleared successfully');
    } catch (err) {
      console.error('Error clearing orders:', err);
      showMessage('error', 'Failed to clear orders');
    } finally {
      setClearingOrders(false);
    }
  };

  const fetchData = async () => {
    try {
      const ordersResp = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      let ordersWithItems: Order[] = [];
      if (ordersResp.data) {
        ordersWithItems = await Promise.all(
          ordersResp.data.map(async (order) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
            return { ...order, items: items || [] } as Order;
          })
        );
      }

      const productsResp = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (ordersResp.error) throw ordersResp.error;
      if (productsResp.error) throw productsResp.error;

      setOrders(ordersWithItems);
      setProducts(productsResp.data || []);

      const unviewed = ordersWithItems.filter((o) => !o.viewed).length;
      setNewOrdersCount(unviewed);
    } catch (err) {
      console.error('Error fetching data:', err);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewOrdersCount = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('viewed', false);

      if (!error && data) {
        setNewOrdersCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching new orders count:', err);
    }
  };

  const markOrdersAsViewed = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ viewed: true })
        .eq('viewed', false);

      if (!error) {
        setNewOrdersCount(0);
        setOrders((prev) => prev.map((o) => ({ ...o, viewed: true })));
      }
    } catch (err) {
      console.error('Error marking orders as viewed:', err);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      showMessage('success', 'Order status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      showMessage('error', 'Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'Cancelled', cancelled_at: new Date().toISOString() } : order
        )
      );
      showMessage('success', 'Order cancelled');
    } catch (err) {
      console.error('Error cancelling order:', err);
      showMessage('error', 'Failed to cancel order');
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingId(productId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${productId}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: urlData.publicUrl })
        .eq('id', productId);

      if (updateError) throw updateError;

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, image_url: urlData.publicUrl } : product
        )
      );
      showMessage('success', 'Image uploaded successfully');
    } catch (err) {
      console.error('Error uploading image:', err);
      showMessage('error', 'Failed to upload image');
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveImage = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product?.image_url) return;

      const { error } = await supabase
        .from('products')
        .update({ image_url: null })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, image_url: null } : p
        )
      );
      showMessage('success', 'Image removed');
    } catch (err) {
      console.error('Error removing image:', err);
      showMessage('error', 'Failed to remove image');
    }
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setEditingProduct(productId);
      setEditPrice(product.price.toString());
      setEditStock(product.stock?.toString() || '100');
    }
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      const price = parseInt(editPrice);
      const stock = parseInt(editStock);

      if (isNaN(price) || isNaN(stock)) {
        showMessage('error', 'Invalid price or stock value');
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ price, stock, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, price, stock } : p
        )
      );
      setEditingProduct(null);
      showMessage('success', 'Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      showMessage('error', 'Failed to update product');
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Phone Number', 'Department', 'Year', 'Products', 'Quantity', 'Total Amount', 'Status', 'Order Date'];
    const rows = orders
      .filter((o) => o.status !== 'Cancelled')
      .map((order) => [
        order.order_id,
        order.full_name,
        order.phone_number,
        order.department,
        order.year,
        order.items.map((i) => i.product_name).join(' | '),
        order.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
        order.total_amount,
        order.status,
        new Date(order.created_at).toLocaleString('en-IN'),
      ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('success', 'Orders exported successfully');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    totalOrders: orders.length,
    totalSales: orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total_amount, 0),
    pendingOrders: orders.filter((o) => o.status === 'Order Received' || o.status === 'Processing').length,
    deliveredOrders: orders.filter((o) => o.status === 'Delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0a298a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage orders, products, and view statistics</p>
          </div>
          <div className="flex gap-3">
            {newOrdersCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                <Bell className="w-5 h-5 animate-pulse" />
                <span className="font-medium">{newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''}</span>
                <button
                  onClick={markOrdersAsViewed}
                  className="ml-2 p-1 hover:bg-red-500/30 rounded"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                <p className="text-sm text-gray-400">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="p-5 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">₹{stats.totalSales}</p>
                <p className="text-sm text-gray-400">Total Sales</p>
              </div>
            </div>
          </div>
          <div className="p-5 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-400">Pending Orders</p>
              </div>
            </div>
          </div>
          <div className="p-5 glass rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.deliveredOrders}</p>
                <p className="text-sm text-gray-400">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'orders'
                ? 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white'
                : 'glass text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
          >
            <Package className="w-5 h-5" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'products'
                ? 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white'
                : 'glass text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
          >
            <ImageIcon className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'stats'
                ? 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white'
                : 'glass text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
          >
            <TrendingUp className="w-5 h-5" />
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white'
                : 'glass text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
          >
            <ImageIcon className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 glass text-gray-300 rounded-xl font-medium hover:bg-white/10 border border-white/5 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowClearOrdersConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 border border-red-500/30 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Orders
          </button>
        </div>

        {/* Clear Orders Confirmation Modal */}
        {showClearOrdersConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-md w-full glass rounded-2xl p-6 text-center border border-red-500/20">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">Clear All Orders?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete all orders? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearOrdersConfirm(false)}
                  disabled={clearingOrders}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllOrders}
                  disabled={clearingOrders}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {clearingOrders ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Clear All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-white/5">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`glass rounded-xl overflow-hidden border ${!order.viewed ? 'border-cyan-500/50 animate-pulse' : 'border-white/5'
                      }`}
                  >
                    <div
                      className="p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        setExpandedOrder(expandedOrder === order.id ? null : order.id);
                        if (!order.viewed) {
                          supabase
                            .from('orders')
                            .update({ viewed: true })
                            .eq('id', order.id)
                            .then(() => {
                              setOrders((prev) =>
                                prev.map((o) =>
                                  o.id === order.id ? { ...o, viewed: true } : o
                                )
                              );
                              setNewOrdersCount((prev) => Math.max(0, prev - 1));
                            });
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {!order.viewed && (
                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/30">
                              NEW
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-white">{order.order_id}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-white">₹{order.total_amount}</p>
                            <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${order.status === 'Cancelled'
                                ? 'text-red-400 bg-red-600/30 border border-red-500/30'
                                : orderStatuses.find((s) => s.value === order.status)?.color || ''
                              }`}
                          >
                            {order.status === 'Cancelled' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              React.createElement(
                                orderStatuses.find((s) => s.value === order.status)?.icon || Package,
                                { className: 'w-4 h-4' }
                              )
                            )}
                            {order.status}
                          </div>

                          {expandedOrder === order.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="border-t border-white/5 p-4 sm:p-6 bg-dark-900/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="font-medium text-white">{order.full_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium text-white">{order.phone_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Department</p>
                            <p className="font-medium text-white">{order.department}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Year</p>
                            <p className="font-medium text-white">{order.year}</p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <p className="text-sm font-medium text-gray-400 mb-2">Items</p>
                          <div className="bg-dark-950 rounded-lg divide-y divide-white/5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="p-3 flex justify-between">
                                <span className="text-white">{item.product_name}</span>
                                <span className="text-gray-400">
                                  {item.quantity} × ₹{item.price_per_unit} = ₹
                                  {item.quantity * item.price_per_unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.status !== 'Cancelled' && (
                          <div className="mb-6">
                            <p className="text-sm font-medium text-gray-400 mb-2">Update Status</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {orderStatuses.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusChange(order.id, status.value)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${order.status === status.value
                                      ? status.color + ' ring-2 ring-cyan-500'
                                      : 'bg-dark-800 hover:bg-dark-700 text-gray-300 border border-white/5'
                                    }`}
                                >
                                  <status.icon className="w-4 h-4 inline mr-1" />
                                  {status.label}
                                </button>
                              ))}
                            </div>

                            {order.status === 'Order Received' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 border border-red-500/30"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel Order
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === 'Cancelled' && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">
                              Order cancelled on {order.cancelled_at ? formatDate(order.cancelled_at) : 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="glass rounded-xl overflow-hidden border border-white/5">
                <div className="aspect-square bg-dark-900 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
                      <ImageIcon className="w-16 h-16 text-gray-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(product.id, file);
                        }}
                        disabled={uploadingId === product.id}
                      />
                      {uploadingId === product.id ? (
                        <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-dark-900" />
                      )}
                    </label>
                    {product.image_url && (
                      <button
                        onClick={() => handleRemoveImage(product.id)}
                        className="p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.meters_per_unit} Meters/Unit</p>

                  {editingProduct === product.id ? (
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-400">Price (₹)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Stock</label>
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveProduct(product.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-white">₹{product.price}</p>
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Orders by Status</h3>
                <div className="space-y-3">
                  {orderStatuses.map((status) => {
                    const count = orders.filter((o) => o.status === status.value).length;
                    const percentage = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    return (
                      <div key={status.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400">{status.label}</span>
                          <span className="text-white font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-[#0a298a] to-[#1a55f2]`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Cancelled</span>
                      <span className="text-white font-medium">{orders.filter((o) => o.status === 'Cancelled').length}</span>
                    </div>
                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-red-500`}
                        style={{ width: `${orders.length > 0 ? Math.round((orders.filter((o) => o.status === 'Cancelled').length / orders.length) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Summary</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-900 rounded-lg">
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">₹{stats.totalSales}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-dark-900 rounded-lg">
                      <p className="text-sm text-gray-400">Average Order Value</p>
                      <p className="text-xl font-bold text-white">
                        ₹{orders.filter((o) => o.status !== 'Cancelled').length > 0
                          ? Math.round(stats.totalSales / orders.filter((o) => o.status !== 'Cancelled').length)
                          : 0}
                      </p>
                    </div>
                    <div className="p-4 bg-dark-900 rounded-lg">
                      <p className="text-sm text-gray-400">Delivered Orders</p>
                      <p className="text-xl font-bold text-white">{stats.deliveredOrders}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-white/5">
                        <td className="py-3 text-white font-medium">{order.order_id}</td>
                        <td className="py-3 text-gray-300">{order.full_name}</td>
                        <td className="py-3 text-white">₹{order.total_amount}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Cancelled'
                              ? 'text-red-400 bg-red-500/20'
                              : order.status === 'Delivered'
                                ? 'text-green-400 bg-green-500/20'
                                : 'text-amber-400 bg-amber-500/20'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Site Logo</h3>
              <p className="text-gray-400 text-sm mb-4">Upload a custom logo that will be displayed on the homepage, navbar, and footer.</p>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#0a298a] to-[#1a55f2] rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Site Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-4xl font-bold">AK</span>
                    )}
                  </div>
                  {logoUrl && (
                    <p className="text-xs text-gray-400 mt-2 text-center">Current Logo</p>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-4">
                  <div className="glass rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-gray-300 mb-3">Upload a new logo image (recommended: square format, PNG or JPG)</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                        <Upload className="w-4 h-4" />
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          disabled={uploadingLogo}
                        />
                      </label>
                      {logoUrl && (
                        <button
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-300">
                      <span className="font-semibold">Tip:</span> For best results, use a square logo image (e.g., 512x512 pixels). The logo will be displayed with rounded corners.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-300">
                      If no custom logo is uploaded, the default "AK" text logo will be displayed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Google Sheets Integration</h3>
              <p className="text-gray-400 text-sm mb-4">Automatically sync all new orders to a Google Sheet for easy record keeping.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Sheets Webhook URL</label>
                  <input
                    type="text"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveGoogleSheetsUrl}
                    disabled={savingSheetsUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Save className="w-4 h-4" />
                    {savingSheetsUrl ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-blue-300 mb-2">
                    <span className="font-semibold">How to set up Google Sheets:</span>
                  </p>
                  <ol className="text-sm text-blue-300/80 list-decimal list-inside space-y-1">
                    <li>Create a new Google Sheet</li>
                    <li>Go to Extensions → Apps Script</li>
                    <li>Create a webhook deployment (see instructions below)</li>
                    <li>Copy the Web App URL and paste it above</li>
                  </ol>
                </div>

                <div className="p-4 bg-dark-900 rounded-xl border border-white/10 overflow-x-auto">
                  <p className="text-xs text-gray-400 mb-2">Google Apps Script Code:</p>
                  <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.orderId,
    data.customerName,
    data.phone,
    data.department,
    data.year,
    data.items,
    data.total,
    data.status,
    new Date().toLocaleString()
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
                </div>

                <a
                  href="https://support.google.com/docs/answer/9063798"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn more about Google Sheets webhooks
                </a>
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Review Management</h3>
              <p className="text-gray-400 text-sm mb-4">Manage customer reviews and feedback. Approve reviews to display them on the homepage.</p>

              <button
                onClick={async () => {
                  try {
                    const { data, error } = await supabase
                      .from('reviews')
                      .select('*')
                      .order('created_at', { ascending: false });

                    if (error) throw error;
                    console.log('Reviews:', data);
                    showMessage('success', `Found ${data?.length || 0} reviews`);
                  } catch (err) {
                    showMessage('error', 'Failed to load reviews');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Load Reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
