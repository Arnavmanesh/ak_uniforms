import React from 'react';
import {
  Truck,
  Banknote,
  Zap,
  Star,
  GraduationCap,
  Shield,
  Phone,
  MessageCircle,
  ShoppingBag,
  Tag,
  Award,
  ArrowRight,
  X,
  Search,
} from 'lucide-react';
import type { Page, Review } from '../types';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const whatsappNumbers = [{ name: 'Anandhu', number: '9074964672' }, { name: 'Kiran', number: '8547959288' }];
  const [showPaymentNotice, setShowPaymentNotice] = React.useState(true);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [averageRating, setAverageRating] = React.useState(0);

  React.useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_displayed', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setReviews(data);

        const { data: avgData } = await supabase
          .from('reviews')
          .select('rating');

        if (avgData && avgData.length > 0) {
          const avg = avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleWhatsApp = (number: string) => {
    window.open(`https://wa.me/91${number}`, '_blank');
  };

  const handleCall = (number: string) => {
    window.open(`tel:+91${number}`, '_self');
  };

  const features = [
    { icon: Truck, title: 'Campus Delivery', desc: 'Convenient delivery at your college campus' },
    { icon: Banknote, title: 'Cash on Delivery', desc: 'Pay when you receive your order' },
    { icon: Zap, title: 'Fast Ordering', desc: 'Simple and quick order placement' },
    { icon: Star, title: 'Trusted by 500+', desc: 'Satisfied students served' },
    { icon: GraduationCap, title: 'Student Focused', desc: 'Designed for college needs' },
    { icon: Shield, title: 'Premium Quality', desc: 'Best materials for uniforms' },
  ];

  const quickLinks = [
    { icon: ShoppingBag, title: 'Order Now', desc: 'Place your uniform order', page: 'student-details' as Page, color: 'from-[#0a298a] to-[#1a55f2]' },
    { icon: Search, title: 'Track Order', desc: 'Check your order status', page: 'track-order' as Page, color: 'from-cyan-600 to-teal-600' },
    { icon: MessageCircle, title: 'Contact Us', desc: 'Get in touch with us', page: 'home' as Page, color: 'from-green-600 to-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Payment Notice Modal */}
      {showPaymentNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-md w-full glass rounded-2xl p-6 sm:p-8 text-center animate-bounce-in">
            <button
              onClick={() => setShowPaymentNotice(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Banknote className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Pay on Delivery</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              No advance payment required! Place your order now and <span className="text-green-400 font-semibold">pay only when your order arrives</span> at your campus.
            </p>

            <button
              onClick={() => setShowPaymentNotice(false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-dark-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a298a]/20 via-transparent to-[#1a55f2]/20"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0a298a]/20 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1a55f2]/20 rounded-full blur-[128px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">Now Accepting Orders</span>
            </div>

            {/* Attractive Hero Logo */}
            <div className="flex justify-center mb-8">
              <Logo variant="hero" size="xl" showText={false} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-white">
              AK Uniforms
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 mb-10 font-light">
              Premium Quality Uniform Cloth for Students
            </p>

            <button
              onClick={() => onNavigate('student-details')}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0a298a] to-[#1a55f2] text-white rounded-2xl font-semibold text-lg hover:opacity-90 transform hover:scale-105 transition-all duration-300 shadow-lg"
              style={{ boxShadow: '0 10px 30px rgba(10, 41, 138, 0.4)' }}
            >
              <ShoppingBag className="w-5 h-5" />
              Order Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-8 bg-dark-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (link.title === 'Contact Us') {
                    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate(link.page);
                  }
                }}
                className="group flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/10 transition-all border border-white/5 text-left"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{link.title}</h3>
                  <p className="text-sm text-gray-400">{link.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-4 bg-amber-500/10 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm">!</span>
            </div>
            <p className="text-amber-300 font-medium text-sm">
              <span className="font-semibold">Important:</span> Cloth material only. Stitching is not included.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 glass text-cyan-400 rounded-full text-sm font-medium mb-4 border border-cyan-500/30">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Benefits of Ordering from AK Uniforms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Award, title: 'Premium Quality Cloth', desc: 'High-grade materials for durability and comfort' },
              { icon: Tag, title: 'Student-Friendly Prices', desc: 'Affordable pricing designed for student budgets' },
              { icon: Banknote, title: 'Pay on Delivery', desc: 'No advance payment — pay when order arrives' },
            ].map((offer, idx) => (
              <div
                key={idx}
                className="group p-6 glass rounded-2xl hover:bg-gradient-to-br hover:from-[#0a298a]/20 hover:to-[#1a55f2]/20 transition-all duration-300 transform hover:-translate-y-1 border border-white/5"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#0a298a] to-[#1a55f2] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <offer.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{offer.title}</h3>
                <p className="text-gray-400">{offer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What We Offer
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-5 glass rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/5"
              >
                <feature.icon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <section className="py-16 bg-dark-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-3xl font-bold text-white">{averageRating}</span>
                <span className="text-gray-400">average rating</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What Our Customers Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="p-6 glass rounded-xl border border-white/5">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                          }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 mb-4">"{review.comment}"</p>
                  )}
                  <p className="text-sm text-gray-400">— {review.customer_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact-section" className="py-16 bg-gradient-to-br from-dark-900 to-dark-950 text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Need Help? Contact Us
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our support team is available to help you with any questions about orders, products, or delivery.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {whatsappNumbers.map((contact) => (
              <React.Fragment key={contact.number}>
                <button
                  onClick={() => handleWhatsApp(contact.number)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                  style={{ boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp {contact.number}
                </button>

                <button
                  onClick={() => handleCall(contact.number)}
                  className="flex items-center gap-2 px-6 py-3 glass rounded-xl font-medium transition-colors border border-white/10 hover:bg-white/10"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
