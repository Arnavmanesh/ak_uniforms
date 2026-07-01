import { Phone, MessageCircle } from 'lucide-react';
import type { Page } from '../types';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const whatsappNumbers = ['9074964672', '8547959288'];

  const handleWhatsApp = (number: string) => {
    window.open(`https://wa.me/91${number}`, '_blank');
  };

  const handleCall = (number: string) => {
    window.open(`tel:+91${number}`, '_self');
  };

  return (
    <footer className="bg-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Quality uniform cloth for college students with a simple ordering process and convenient campus delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('student-details')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Order Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Admin Panel
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Support</h3>
            <div className="space-y-3">
              {whatsappNumbers.map((number) => (
                <div key={number} className="flex items-center gap-3">
                  <button
                    onClick={() => handleWhatsApp(number)}
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp: {number}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              {whatsappNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handleCall(number)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm text-gray-300"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 AK Uniforms. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
