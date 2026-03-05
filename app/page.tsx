"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Download, ScanBarcode } from 'lucide-react';
import gsap from 'gsap';
import styles from './page.module.css';

export default function MobileHome() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
    };

    setIsStandalone(checkStandalone());

    // Fade in animation
    gsap.fromTo('.animate-in',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const handleInstallClick = () => {
    // Note: Actual installation requires intercepting the `beforeinstallprompt` event.
    // For iOS, it requires manual instructions (Share -> Add to Home Screen).
    alert("To install, tap 'Share' then 'Add to Home Screen' on iOS, or 'Add to Home Screen' from the menu on Android.");
  };

  const startScanner = () => {
    router.push('/scanner');
  };

  // Prevent flashing before standalone check
  if (isStandalone === null) return null;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={`${styles.logoWrapper} animate-in`}>
          <Image
            src="/logo-blue.png"
            alt="Sama Kerr"
            fill
            className={styles.logo}
            priority
          />
        </div>

        {isStandalone ? (
          <div className={`${styles.card} animate-in`}>
            <div className={styles.iconCircle}>
              <ScanBarcode size={32} color="var(--accent-blue)" />
            </div>
            <h1 className={styles.title}>Welcome Home</h1>
            <p className={styles.subtitle}>
              Ready to take control of your property? Scan the unique QR code provided by your property manager to instantly connect your home.
            </p>
            <button onClick={startScanner} className={`btn-primary ${styles.fullWidth}`}>
              Scan Property QR
            </button>
            <p className={styles.hint}>Make sure your camera is clean and well-lit.</p>
          </div>
        ) : (
          <div className={`${styles.card} animate-in`}>
            <div className={styles.iconCircle}>
              <Download size={32} color="var(--accent-blue)" />
            </div>
            <h1 className={styles.title}>Install the App</h1>
            <p className={styles.subtitle}>
              Sama Kerr is designed to be installed as an app on your phone for full functionality, offline support, and a better experience.
            </p>
            <button onClick={handleInstallClick} className={`btn-primary ${styles.fullWidth}`}>
              Install Sama Kerr
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
