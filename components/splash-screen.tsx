'use client';

import { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const DEFAULT_APP_NAME = 'BAR HOTEL MANAGER PRO';
const DEVELOPER_NAME = 'Julio Cesar Campos Machado';
const DEVELOPER_LINKEDIN = 'https://www.linkedin.com/in/juliocamposmachado';
const COMPANY_NAME = 'Like Look Solutions';

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { settings } = useEstablishment();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load branding from localStorage
    const savedBranding = localStorage.getItem('branding_config');
    if (savedBranding) {
      try {
        const branding = JSON.parse(savedBranding);
        if (branding.app_name) setAppName(branding.app_name);
        if (branding.logo_url) setLogoUrl(branding.logo_url);
      } catch (e) {
        // Use defaults
      }
    }

    // Also check establishment settings
    if (settings?.name) {
      // Use custom name if available but prefer branding config
    }
    if (settings?.logo_url && !logoUrl) {
      setLogoUrl(settings.logo_url);
    }
  }, [settings]);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 30;
    const step = (100 * interval) / duration;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    // Complete splash after duration
    const completeTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Logo and App Name */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container with glow effect */}
        <div className="relative mb-8">
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-60"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              transform: 'scale(1.2)',
            }}
          />

          {/* Logo */}
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="w-16 h-16"
              >
                <g fill="white">
                  <rect x="60" y="60" width="160" height="120" rx="15" fillOpacity="0.9"/>
                  <rect x="230" y="60" width="160" height="120" rx="15" fillOpacity="0.9"/>
                  <rect x="400" y="60" width="52" height="120" rx="15" fillOpacity="0.9"/>
                  <rect x="60" y="200" width="180" height="120" rx="15" fillOpacity="0.9"/>
                  <rect x="260" y="200" width="192" height="120" rx="15" fillOpacity="0.9"/>
                  <path d="M60 360 L80 420 L100 360" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M120 360 L140 420 L160 360" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M180 360 L200 420 L220 360" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M240 360 L260 420 L280 360" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* App Name */}
        <h1
          className="text-3xl md:text-4xl font-bold text-white text-center mb-2 tracking-tight"
          style={{ textShadow: '0 4px 20px rgba(59, 130, 246, 0.5)' }}
        >
          {appName}
        </h1>

        {/* Tagline */}
        <p className="text-blue-300/80 text-sm md:text-base mb-12">
          Sistema de Gestão Inteligente
        </p>

        {/* Progress bar */}
        <div className="w-64 md:w-80">
          <div
            className="h-1.5 bg-white/10 rounded-full overflow-hidden"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              }}
            />
          </div>
          <p className="text-white/50 text-xs mt-2 text-center">
            {progress < 30
              ? 'Carregando dados...'
              : progress < 60
              ? 'Inicializando sistema...'
              : progress < 90
              ? 'Preparando interface...'
              : 'Pronto!'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/40 text-xs mb-1">
          Desenvolvido por{' '}
          <span className="text-blue-400/80 font-medium">{COMPANY_NAME}</span>
        </p>
        <p className="text-white/30 text-xs">
          Desenvolvedor:{' '}
          <a
            href={DEVELOPER_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400/60 hover:text-blue-400 transition-colors"
          >
            {DEVELOPER_NAME}
          </a>
        </p>
        <p className="text-white/20 text-xs mt-2">
          &copy; {new Date().getFullYear()} BAR HOTEL MANAGER PRO
        </p>
      </div>
    </div>
  );
}
