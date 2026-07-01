import React from 'react';
import { supabase } from '../lib/supabase';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'hero';
}

export function Logo({ size = 'md', showText = true, variant = 'default' }: LogoProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchLogo();
  }, []);

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

  const sizeConfig = {
    sm: { container: 'w-8 h-8', text: 'text-sm' },
    md: { container: 'w-12 h-12', text: 'text-lg' },
    lg: { container: 'w-20 h-20', text: 'text-2xl' },
    xl: { container: 'w-28 h-28', text: 'text-3xl' },
  };

  const config = sizeConfig[size];

  if (variant === 'hero') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0a298a] to-[#1a55f2] blur-xl opacity-50 animate-pulse"></div>

          {/* Main container */}
          <div
            className={`relative ${size === 'xl' ? 'w-32 h-32' : size === 'lg' ? 'w-28 h-28' : 'w-24 h-24'} rounded-3xl bg-gradient-to-br from-[#0a298a] via-[#0f38ce] to-[#1a55f2] flex items-center justify-center transform hover:scale-110 transition-transform duration-500 overflow-hidden`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(10, 41, 138, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            }}
          >
            {/* Inner decorative elements */}
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"></div>

            {logoUrl ? (
              <img
                src={logoUrl}
                alt="AK Uniforms Logo"
                className="w-full h-full object-cover rounded-3xl relative z-10"
              />
            ) : (
              <span
                className="font-black text-white tracking-tighter relative z-10"
                style={{
                  fontSize: size === 'xl' ? '4rem' : size === 'lg' ? '3.5rem' : '3rem',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                AK
              </span>
            )}

            {/* Shine effect */}
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
          </div>

          {/* Corner accents */}
          {/* <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white/30 rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-white/30 rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-white/30 rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white/30 rounded-br-lg"></div> */}
        </div>

        {showText && (
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              AK Uniforms
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Premium Quality Uniforms</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={`${config.container} bg-gradient-to-br from-[#0a298a] via-[#0f38ce] to-[#1a55f2] rounded-xl flex items-center justify-center overflow-hidden`}
          style={{
            boxShadow: '0 4px 20px rgba(10, 41, 138, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          }}
        >
          {/* Shine */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>

          {logoUrl ? (
            <img
              src={logoUrl}
              alt="AK Uniforms Logo"
              className="w-full h-full object-cover rounded-xl relative z-10"
            />
          ) : (
            <span
              className="font-black text-white tracking-tighter relative z-10"
              style={{
                fontSize: size === 'sm' ? '0.9rem' : size === 'md' ? '1.3rem' : size === 'lg' ? '2rem' : '2.5rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              AK
            </span>
          )}
        </div>
      </div>

      {showText && (
        <span className={`font-bold text-white ${config.text}`}>
          AK Uniforms
        </span>
      )}
    </div>
  );
}
