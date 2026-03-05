"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Download, ScanBarcode, Share, PlusSquare, X } from 'lucide-react';
import gsap from 'gsap';

export default function MobileHome() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallAnim, setShowInstallAnim] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
    };

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsStandalone(checkStandalone());

    // Fade in animation
    gsap.fromTo('.animate-in',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    if (showInstallAnim) {
      const tl = gsap.timeline();
      tl.to('.mock-overlay', { opacity: 1, duration: 0.3 })
        .fromTo('.mock-popup', { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' })
        .to('.mock-cursor', { opacity: 1, duration: 0.2 })
        .to('.mock-cursor', { x: 0, y: 0, duration: 1, ease: 'power2.inOut' })
        .to('.mock-cursor', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.mock-share-btn', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }, "-=0.2")
        .to('.mock-menu', { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' }, "+=0.2")
        .to('.mock-cursor', { x: 0, y: -60, duration: 1, ease: 'power2.inOut' })
        .to('.mock-cursor', { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.mock-add-btn', { backgroundColor: '#f3f4f6', duration: 0.1, yoyo: true, repeat: 1 }, "-=0.2");
    }
  }, [showInstallAnim]);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowInstallAnim(true);
    } else {
      alert("To install on Android, tap the menu (three dots) and select 'Add to Home Screen'.");
    }
  };

  const startScanner = () => {
    router.push('/scanner');
  };

  // Prevent flashing before standalone check
  if (isStandalone === null) return null;

  return (
    <main className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-black p-5">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Content Wrapper */}
      <div className="w-full max-w-[400px] flex flex-col items-center gap-8 relative z-10">
        <div className="relative w-[160px] h-[44px] mb-5 animate-in">
          <Image
            src="/logo-blue.png"
            alt="Sama Kerr"
            fill
            className="object-contain"
            priority
          />
        </div>

        {isStandalone ? (
          <div className="bg-primary-bg w-full rounded-3xl p-10 py-10 flex flex-col items-center text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border-subtle animate-in">
            <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mb-6">
              <ScanBarcode size={32} color="var(--accent-blue)" />
            </div>
            <h1 className="text-2xl font-semibold mb-3 text-primary-text">Welcome Home</h1>
            <p className="text-[15px] text-secondary-text leading-relaxed mb-8">
              Ready to take control of your property? Scan the unique QR code provided by your property manager to instantly connect your home.
            </p>
            <button onClick={startScanner} className="w-full bg-accent-blue hover:bg-accent-hover text-white py-3 px-6 rounded-full font-semibold transition-transform hover:-translate-y-px flex justify-center items-center">
              Scan Property QR
            </button>
            <p className="text-[13px] text-secondary-text opacity-80 mt-4">Make sure your camera is clean and well-lit.</p>
          </div>
        ) : (
          <div className="bg-primary-bg w-full rounded-3xl p-10 py-10 flex flex-col items-center text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border-subtle animate-in">
            <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mb-6">
              <Download size={32} color="var(--accent-blue)" />
            </div>
            <h1 className="text-2xl font-semibold mb-3 text-primary-text">Install the App</h1>
            <p className="text-[15px] text-secondary-text leading-relaxed mb-8">
              Sama Kerr is designed to be installed as an app on your phone for full functionality, offline support, and a better experience.
            </p>
            <button onClick={handleInstallClick} className="w-full bg-accent-blue hover:bg-accent-hover text-white py-3 px-6 rounded-full font-semibold transition-transform hover:-translate-y-px flex justify-center items-center">
              Install Sama Kerr
            </button>
          </div>
        )}
      </div>

      {/* iOS Mockup Animation Overlay */}
      {showInstallAnim && (
        <div className="mock-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end opacity-0 pointer-events-auto">
          <button onClick={() => setShowInstallAnim(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">
            <X size={24} />
          </button>
          <div className="mock-popup w-full bg-[#f2f2f7] rounded-t-[32px] overflow-hidden shadow-2xl pb-10">
            <div className="w-full px-6 pt-6 pb-4">
              <h3 className="text-[20px] font-semibold text-center mb-2">Install Sama Kerr</h3>
              <p className="text-[15px] text-center text-secondary-text mb-6 leading-tight">Follow these steps to add the app to your Home Screen for full native functionality.</p>
            </div>

            <div className="relative w-[300px] mx-auto bg-white rounded-3xl overflow-hidden border-[4px] border-black shadow-xl aspect-[9/19] flex flex-col justify-end pb-8">
              {/* Fake Browser Content */}
              <div className="bg-white/80 absolute inset-0 pt-12 flex flex-col items-center opacity-50">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-4"></div>
                <div className="w-32 h-4 bg-gray-200 rounded-full"></div>
              </div>

              {/* Fake Native Safari Bottom Menu */}
              <div className="mock-menu h-0 opacity-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] absolute bottom-0 w-full flex flex-col rounded-t-2xl z-20">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <Image src="/icon-192x192.png" width={40} height={40} className="rounded-lg border border-gray-200" alt="Icon" />
                  <div>
                    <p className="text-[14px] font-semibold text-black leading-tight">Sama Kerr Suite</p>
                    <p className="text-[12px] text-gray-500">app.samakerr.gm</p>
                  </div>
                </div>
                <div className="mock-add-btn p-4 flex items-center gap-4 text-black border-b border-gray-100">
                  <PlusSquare size={22} className="text-gray-800" />
                  <span className="text-[16px] font-medium">Add to Home Screen</span>
                </div>
              </div>

              {/* Fake Native Browser Toolbar */}
              <div className="h-[70px] bg-white/90 backdrop-blur border-t border-gray-200 absolute bottom-0 w-full flex items-center justify-around px-2 z-10 pt-2 pb-6 text-[#007aff]">
                <Share size={24} className="opacity-50" />
                <Share size={24} className="opacity-50" />
                <div className="mock-share-btn w-12 h-12 flex items-center justify-center -mt-2">
                  <Share size={28} />
                </div>
                <Share size={24} className="opacity-50" />
                <Share size={24} className="opacity-50" />
              </div>

              {/* Fake Hand Cursor */}
              <div className="mock-cursor absolute w-12 h-12 bg-[url('https://cdn-icons-png.flaticon.com/512/3565/3565352.png')] bg-contain bg-no-repeat opacity-0 z-30" style={{ transform: 'translate(60px, 120px)' }}></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
