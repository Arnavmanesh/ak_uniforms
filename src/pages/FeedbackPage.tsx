import React from 'react';
import { Star, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import type { Page } from '../types';
import { supabase } from '../lib/supabase';

interface FeedbackPageProps {
  onNavigate: (page: Page) => void;
  orderId?: string;
}

export function FeedbackPage({ onNavigate, orderId: propOrderId }: FeedbackPageProps) {
  const [orderId, setOrderId] = React.useState(propOrderId || '');
  const [rating, setRating] = React.useState(0);
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [orderInfo, setOrderInfo] = React.useState<{ full_name: string; department: string } | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  const departments = ['CS', 'EC', 'EEE', 'ME', 'ECS', 'AI'];

  const verifyOrder = async (id: string) => {
    if (!id.trim()) return;

    setVerifying(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('full_name, department, status')
        .eq('order_id', id.toUpperCase().trim())
        .single();

      if (fetchError || !data) {
        setError('Order not found');
        setOrderInfo(null);
        return;
      }

      if (data.status !== 'Delivered') {
        setError('Feedback can only be submitted for delivered orders');
        setOrderInfo(null);
        return;
      }

      setOrderInfo({ full_name: data.full_name, department: data.department });
      setCustomerName(data.full_name);
      setDepartment(data.department);
      setError(null);
    } catch {
      setError('Failed to verify order');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim() || rating === 0 || !customerName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId.toUpperCase().trim(),
          rating,
          comment: comment.trim() || null,
          customer_name: customerName.trim(),
          department: department || null,
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (propOrderId) {
      verifyOrder(propOrderId);
    }
  }, [propOrderId]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-950 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="glass rounded-2xl p-8 border border-white/5">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-400 mb-6">Your feedback has been submitted successfully. We appreciate your time!</p>
            <button
              onClick={() => onNavigate('home')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Share Your Feedback</h1>
          <p className="text-gray-400">We'd love to hear about your experience with AK Uniforms</p>
        </div>

        {/* Order Verification */}
        {!orderInfo && (
          <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Verify Your Order</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                placeholder="Enter Order ID (e.g., AK001)"
                className="flex-1 px-4 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
              />
              <button
                onClick={() => verifyOrder(orderId)}
                disabled={verifying || !orderId.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/10 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {orderInfo && (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">How would you rate your experience?</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 outline-none text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 outline-none text-white appearance-none"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Comments (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the product quality, delivery experience, etc."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 outline-none text-white placeholder-gray-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || rating === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
