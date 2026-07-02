import React from 'react';
import { ArrowLeft, ArrowRight, User, Phone, Building, GraduationCap, ShoppingBag, AlertCircle } from 'lucide-react';
import type { Page, CustomerDetails, Product, OrderItem } from '../types';
import { supabase } from '../lib/supabase';

interface OrderReviewPageProps {
  customerDetails: CustomerDetails | null;
  cartItems: { productId: string; quantity: number }[];
  onNavigate: (page: Page) => void;
  onConfirm: (orderId: string) => void;
}

export function OrderReviewPage({ customerDetails, cartItems, onNavigate, onConfirm }: OrderReviewPageProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const orderItems: OrderItem[] = cartItems
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product_id: item.productId,
        product_name: product?.name || 'Unknown',
        quantity: item.quantity,
        price_per_unit: product?.price || 0,
      };
    });

  orderItems.sort((a, b) => {
    const prodA = products.find((p) => p.id === a.product_id);
    const prodB = products.find((p) => p.id === b.product_id);
    return (prodA?.display_order || 0) - (prodB?.display_order || 0);
  });

  const getTotalAmount = (): number => {
    return orderItems.reduce((total, item) => total + item.price_per_unit * item.quantity, 0);
  };

  const generateOrderId = async (): Promise<string> => {
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('order_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    let nextNumber = 1;
    if (data && data.length > 0 && data[0].order_id) {
      const match = data[0].order_id.match(/AK(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `AK${String(nextNumber).padStart(3, '0')}`;
  };

  const sendWhatsAppNotification = (orderId: string, customerDetails: CustomerDetails, items: OrderItem[], total: number) => {
    const message = `*NEW ORDER - AK UNIFORMS*

Order ID: ${orderId}

*Customer Details:*
Name: ${customerDetails.fullName}
Phone: ${customerDetails.phoneNumber}
Department: ${customerDetails.department}
Year: ${customerDetails.year}

*Order Items:*
${items.map((item) => `- ${item.product_name} x${item.quantity} = ₹${item.quantity * item.price_per_unit}`).join('\n')}

*Total Amount: ₹${total}*
Payment: Cash on Delivery

Order placed on: ${new Date().toLocaleString('en-IN')}`

    const encodedMessage = encodeURIComponent(message);

    // Send to both WhatsApp numbers
    const whatsappNumbers = ['9074964672', '8547959288'];
    whatsappNumbers.forEach((number) => {
      window.open(`https://wa.me/91${number}?text=${encodedMessage}`, '_blank');
    });
  };

  const syncToGoogleSheets = async (orderId: string, customerDetails: CustomerDetails, items: OrderItem[], total: number) => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'google_sheets_webhook_url')
        .single();

      if (!data?.setting_value) return;

      await fetch(data.setting_value, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: customerDetails.fullName,
          phone: customerDetails.phoneNumber,
          department: customerDetails.department,
          year: customerDetails.year,
          items: items.map((i) => `${i.product_name} (${i.quantity})`).join(', '),
          total,
          status: 'Order Received',
        }),
      });
    } catch (err) {
      console.error('Error syncing to Google Sheets:', err);
    }
  };

  const handleSubmitOrder = async () => {
    if (!customerDetails || orderItems.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const orderId = await generateOrderId();
      const { department, year, fullName: full_name, phoneNumber: phone_number } = customerDetails;
      const totalAmount = getTotalAmount();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          full_name,
          phone_number,
          department,
          year,
          total_amount: totalAmount,
          payment_method: 'Cash on Delivery',
          status: 'Order Received',
          viewed: false,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = orderItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // Send WhatsApp notification
      sendWhatsAppNotification(orderId, customerDetails, orderItems, totalAmount);

      // Sync to Google Sheets if configured
      syncToGoogleSheets(orderId, customerDetails, orderItems, totalAmount);

      onConfirm(orderId);
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0a298a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customerDetails) {
    onNavigate('student-details');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Review Your Order</h1>
          <p className="text-gray-400">Please verify your details before placing the order</p>
        </div>

        {/* Customer Details */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#1a55f2]" />
            Customer Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-dark-900 rounded-xl border border-white/5">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium text-white">{customerDetails.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-900 rounded-xl border border-white/5">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-medium text-white">{customerDetails.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-900 rounded-xl border border-white/5">
              <Building className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-white">{customerDetails.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-900 rounded-xl border border-white/5">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p className="font-medium text-white">{customerDetails.year}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#1a55f2]" />
            Order Items
          </h2>

          <div className="space-y-4">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-dark-900 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">{item.product_name}</p>
                  <p className="text-sm text-gray-500">₹{item.price_per_unit} x {item.quantity}</p>
                </div>
                <p className="font-semibold text-white">₹{item.price_per_unit * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-2xl font-bold text-white">₹{getTotalAmount()}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
          <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
            <div>
              <p className="font-medium text-green-300">Cash on Delivery</p>
              <p className="text-sm text-green-400/70">Pay only when your order arrives</p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-6 p-4 glass rounded-xl border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">Important:</span> Delivery will be arranged at the college campus. We will contact you soon after placing the order.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={submitting || orderItems.length === 0}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${submitting || orderItems.length === 0
            ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white hover:opacity-90 transform hover:scale-[1.02]'
            }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Placing Order...
            </>
          ) : (
            <>
              Confirm Order
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
