import React from 'react';
import { CheckCircle, ShoppingBag, Home, MessageCircle, Copy, Check } from 'lucide-react';
import type { Page } from '../types';

interface OrderConfirmationPageProps {
  orderId: string;
  onNavigate: (page: Page) => void;
}

const whatsappNumbers = ['9074964672', '8547959288'];

export function OrderConfirmationPage({ orderId, onNavigate }: OrderConfirmationPageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (number: string) => {
    const message = encodeURIComponent(`Hi, I just placed an order with Order ID: ${orderId}. I have a question about my order.`);
    window.open(`https://wa.me/91${number}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="glass rounded-2xl p-6 sm:p-8 text-center border border-white/5">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto" style={{ boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)' }}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Order Placed Successfully!
          </h1>

          {/* Order ID */}
          <div className="my-6 p-4 glass rounded-xl inline-flex items-center gap-3 border border-white/10">
            <span className="text-gray-400">Order ID:</span>
            <span className="font-bold text-xl text-white">{orderId}</span>
            <button
              onClick={handleCopyId}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy Order ID"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Success Message */}
          <div className="p-6 bg-gradient-to-r from-[#0a298a]/20 to-[#1a55f2]/20 rounded-xl mb-6 border border-[#1a55f2]/20">
            <ShoppingBag className="w-8 h-8 text-[#1a55f2] mx-auto mb-3" />
            <p className="text-lg font-medium text-white mb-2">Thank you for ordering from AK Uniforms!</p>
            <p className="text-gray-400 text-sm">
              We will contact you soon. Delivery will be arranged at the college campus.
            </p>
          </div>

          {/* Important Info */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 text-left">
            <p className="text-green-300 text-sm">
              <span className="font-semibold">Pay on Delivery:</span> No advance payment required. Pay only when your order arrives.
            </p>
          </div>

          {/* Contact Buttons */}
          <div className="mb-6">
            <p className="text-gray-400 mb-3">Need help? Contact us:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {whatsappNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handleWhatsApp(number)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              ))}
            </div>
          </div>

          {/* Back to Home */}
          <button
            onClick={() => onNavigate('home')}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 glass text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition-colors border border-white/10"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 space-y-3">
          <div className="p-4 glass rounded-xl border border-[#1a55f2]/20">
            <p className="text-[#1a55f2] text-sm text-center">
              <span className="font-semibold">Remember:</span> Save your Order ID ({orderId}) for future reference. Use it to track your order status.
            </p>
          </div>

          <button
            onClick={() => onNavigate('track-order')}
            className="w-full p-4 glass rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-center"
          >
            <p className="text-gray-300 text-sm">
              Track your order anytime using your Order ID
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
