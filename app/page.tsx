'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/app-shell';
import DashboardContent from './dashboard/page';
import SplashScreen from '@/components/splash-screen';

export default function Home() {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Check if splash was shown before
    const splashShown = localStorage.getItem('splash_shown');
    if (splashShown === 'true') {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setSplashComplete(true);
    setShowSplash(false);
    localStorage.setItem('splash_shown', 'true');
  };

  if (showSplash && !splashComplete) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
