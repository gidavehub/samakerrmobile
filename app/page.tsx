"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Download, ScanBarcode, X, PlusSquare,
  ChevronLeft, ChevronRight, Share2, BookOpen, Copy,
  MoreVertical, Compass, RotateCcw, Star
} from 'lucide-react';
import gsap from 'gsap';

export default function MobileHome() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallAnim, setShowInstallAnim] = useState(false);
  const router = useRouter();
  const animRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const checkStandalone = () => {
      // Force true for desktop browser testing
      return true;
      // Production:
      // return window.matchMedia('(display-mode: standalone)').matches ||
      //     (window.navigator as any).standalone ||
      //     document.referrer.includes('android-app://');
    };

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsStandalone(checkStandalone());

    gsap.fromTo('.animate-in',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    if (showInstallAnim) {
      const tl = gsap.timeline();
      animRef.current = tl;

      if (isIOS) {
        // iOS Safari animation
        tl.to('.mock-overlay', { opacity: 1, duration: 0.3 })
          .fromTo('.mock-popup', { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' })
          // Cursor appears and moves to share button
          .to('.mock-cursor', { opacity: 1, duration: 0.2 })
          .to('.mock-cursor', { x: 0, y: -10, duration: 0.8, ease: 'power2.inOut' })
          .to('.mock-cursor', { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
          .to('.mock-share-btn', { scale: 0.9, duration: 0.15, yoyo: true, repeat: 1, backgroundColor: 'rgba(0,122,255,0.1)' }, '-=0.2')
          // Share sheet slides up
          .to('.mock-share-menu', { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' }, '+=0.3')
          // Cursor moves to "Add to Home Screen"
          .to('.mock-cursor', { x: 0, y: -80, duration: 0.8, ease: 'power2.inOut' })
          .to('.mock-cursor', { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
          .to('.mock-add-btn', { backgroundColor: '#e5e7eb', duration: 0.15, yoyo: true, repeat: 1 }, '-=0.2')
          // Loop
          .to('.mock-share-menu', { height: 0, opacity: 0, duration: 0.3 }, '+=0.8')
          .set('.mock-cursor', { x: 60, y: 120, opacity: 0 })
          .call(() => {
            if (animRef.current) animRef.current.restart();
          }, [], '+=0.5');
      } else {
        // Android Chrome animation
        tl.to('.mock-overlay', { opacity: 1, duration: 0.3 })
          .fromTo('.mock-popup', { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' })
          // Cursor moves to 3-dot menu
          .to('.mock-cursor', { opacity: 1, duration: 0.2 })
          .to('.mock-cursor', { x: 0, y: -10, duration: 0.8, ease: 'power2.inOut' })
          .to('.mock-cursor', { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
          .to('.mock-menu-btn', { scale: 0.9, duration: 0.15, yoyo: true, repeat: 1, backgroundColor: 'rgba(0,0,0,0.05)' }, '-=0.2')
          // Dropdown menu appears
          .to('.mock-dropdown', { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }, '+=0.3')
          // Cursor moves to "Add to Home screen"
          .to('.mock-cursor', { x: -30, y: -50, duration: 0.8, ease: 'power2.inOut' })
          .to('.mock-cursor', { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
          .to('.mock-add-btn', { backgroundColor: '#e5e7eb', duration: 0.15, yoyo: true, repeat: 1 }, '-=0.2')
          // Loop
          .to('.mock-dropdown', { height: 0, opacity: 0, duration: 0.3 }, '+=0.8')
          .set('.mock-cursor', { x: 60, y: 120, opacity: 0 })
          .call(() => {
            if (animRef.current) animRef.current.restart();
          }, [], '+=0.5');
      }
    }

    return () => {
      if (animRef.current) {
        animRef.current.kill();
        animRef.current = null;
      }
    };
  }, [showInstallAnim, isIOS]);

  const handleInstallClick = () => {
    setShowInstallAnim(true);
  };

  const startScanner = () => {
    router.push('/scanner');
  };

  if (isStandalone === null) return null;

  return (
    <main className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-black p-5">
      {/* Background Video */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="w-full max-w-[400px] flex flex-col items-center gap-8 relative z-10">
        <div className="relative w-[160px] h-[44px] mb-5 animate-in">
          <Image src="/logo-blue.png" alt="Sama Kerr" fill className="object-contain" priority />
        </div>

        {isStandalone ? (
          <div className="bg-primary-bg w-full rounded-3xl p-10 flex flex-col items-center text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border-subtle animate-in">
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
          <div className="bg-primary-bg w-full rounded-3xl p-10 flex flex-col items-center text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-border-subtle animate-in">
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

      {/* Install Mockup Overlay */}
      {showInstallAnim && (
        <div className="mock-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-end opacity-0 pointer-events-auto">
          {/* Close */}
          <button onClick={() => setShowInstallAnim(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md z-50">
            <X size={24} />
          </button>

          {/* Bottom Sheet */}
          <div className="mock-popup w-full bg-[#f2f2f7] rounded-t-[32px] overflow-hidden shadow-2xl pb-8 max-h-[90vh] overflow-y-auto">
            <div className="w-full px-6 pt-6 pb-4">
              <h3 className="text-[20px] font-semibold text-center mb-2 text-black">
                {isIOS ? 'Install on iPhone' : 'Install on Android'}
              </h3>
              <p className="text-[14px] text-center text-gray-500 mb-6 leading-snug">
                Follow these steps to add Sama Kerr to your Home Screen.
              </p>
            </div>

            {/* Phone Mockup */}
            <div className="relative w-[280px] mx-auto bg-white rounded-[36px] overflow-hidden border-[4px] border-black shadow-xl aspect-[9/19.5] flex flex-col">

              {/* ────── Device Top ────── */}
              {isIOS ? (
                /* Dynamic Island */
                <div className="relative w-full h-10 bg-black flex items-center justify-center">
                  <div className="w-[90px] h-[26px] bg-black rounded-full border-[2px] border-gray-800 relative flex items-center justify-between px-3">
                    <div className="w-[8px] h-[8px] rounded-full bg-gray-700"></div>
                    <div className="w-[5px] h-[5px] rounded-full bg-gray-600"></div>
                  </div>
                </div>
              ) : (
                /* Android Camera Dot */
                <div className="relative w-full h-8 bg-white flex items-center justify-center">
                  <div className="w-[10px] h-[10px] rounded-full bg-gray-800 shadow-sm"></div>
                </div>
              )}

              {/* ────── Browser Chrome ────── */}
              {isIOS ? (
                /* Safari URL Bar */
                <div className="bg-[#f2f2f7] px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                  <div className="text-[11px] text-gray-400 font-medium">aA</div>
                  <div className="flex-1 bg-white rounded-lg py-1.5 px-3 text-center text-[12px] text-gray-600 font-medium truncate shadow-sm">
                    app.samakerr.gm
                  </div>
                  <RotateCcw size={14} className="text-gray-400" />
                </div>
              ) : (
                /* Chrome URL Bar + 3-dot */
                <div className="bg-white px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex-1 bg-gray-100 rounded-full py-1.5 px-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="text-[11px] text-gray-600 truncate">app.samakerr.gm</span>
                  </div>
                  <div className="mock-menu-btn w-7 h-7 flex items-center justify-center rounded-full">
                    <MoreVertical size={16} className="text-gray-600" />
                  </div>
                </div>
              )}

              {/* ────── Page Content (blurred placeholder) ────── */}
              <div className="flex-1 bg-white flex flex-col items-center justify-center opacity-40 relative">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-3"></div>
                <div className="w-28 h-3 bg-gray-200 rounded-full mb-2"></div>
                <div className="w-20 h-3 bg-gray-100 rounded-full"></div>
              </div>

              {/* ────── Bottom Toolbar ────── */}
              {isIOS ? (
                /* Safari Bottom Toolbar */
                <div className="h-[56px] bg-[#f2f2f7] border-t border-gray-200 flex items-center justify-around px-4 text-[#007aff] relative z-10">
                  <ChevronLeft size={22} className="opacity-40" />
                  <ChevronRight size={22} className="opacity-40" />
                  <div className="mock-share-btn w-10 h-10 flex items-center justify-center rounded-lg transition-colors">
                    <Share2 size={22} />
                  </div>
                  <BookOpen size={22} className="opacity-40" />
                  <Copy size={22} className="opacity-40" />
                </div>
              ) : (
                /* Android: No bottom toolbar (Chrome uses top bar) */
                <div className="h-[12px] bg-white border-t border-gray-100 flex items-center justify-center">
                  <div className="w-[80px] h-[4px] bg-gray-300 rounded-full"></div>
                </div>
              )}

              {/* ────── iOS Share Sheet ────── */}
              {isIOS && (
                <div className="mock-share-menu h-0 opacity-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.12)] absolute bottom-[56px] w-full flex flex-col rounded-t-2xl z-20 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                    <Image src="/icon-192x192.png" width={36} height={36} className="rounded-lg border border-gray-200" alt="Icon" />
                    <div>
                      <p className="text-[13px] font-semibold text-black leading-tight">Sama Kerr</p>
                      <p className="text-[11px] text-gray-500">app.samakerr.gm</p>
                    </div>
                  </div>
                  <div className="mock-add-btn p-3 flex items-center gap-3 text-black transition-colors">
                    <PlusSquare size={20} className="text-gray-700" />
                    <span className="text-[14px] font-medium">Add to Home Screen</span>
                  </div>
                  <div className="p-3 flex items-center gap-3 text-black border-t border-gray-100">
                    <Copy size={20} className="text-gray-400" />
                    <span className="text-[14px] text-gray-400">Copy Link</span>
                  </div>
                </div>
              )}

              {/* ────── Android Chrome Dropdown ────── */}
              {!isIOS && (
                <div className="mock-dropdown h-0 opacity-0 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] absolute top-[68px] right-2 w-[200px] flex flex-col rounded-lg z-20 overflow-hidden border border-gray-100">
                  <div className="p-3 text-[13px] text-gray-500 border-b border-gray-100">New tab</div>
                  <div className="p-3 text-[13px] text-gray-500 border-b border-gray-100">New incognito tab</div>
                  <div className="mock-add-btn p-3 text-[13px] text-black font-medium border-b border-gray-100 flex items-center gap-2 transition-colors">
                    <PlusSquare size={16} className="text-gray-600" />
                    Add to Home screen
                  </div>
                  <div className="p-3 text-[13px] text-gray-500 flex items-center gap-2">
                    <Star size={16} className="text-gray-400" />
                    Bookmark
                  </div>
                </div>
              )}

              {/* ────── Animated Cursor ────── */}
              <div
                className="mock-cursor absolute w-10 h-10 opacity-0 z-30 pointer-events-none"
                style={{ bottom: isIOS ? '70px' : 'auto', top: isIOS ? 'auto' : '70px', right: isIOS ? 'auto' : '20px', left: isIOS ? '50%' : 'auto', transform: 'translate(60px, 120px)' }}
              >
                {/* CSS finger cursor */}
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-lg">
                  <path d="M6 9.5V5.5C6 4.67 6.67 4 7.5 4S9 4.67 9 5.5V8.5l1-.5c.83-.42 1.83-.17 2.37.58l3.13 4.42c.53.75.53 1.75 0 2.5l-2 2.83c-.53.75-1.42 1.17-2.37 1.17H8.5c-1.38 0-2.5-1.12-2.5-2.5V9.5z" fill="white" stroke="#333" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Step indicator text */}
            <div className="mt-6 px-6 text-center">
              <p className="text-[13px] text-gray-500 font-medium">
                {isIOS
                  ? '① Tap the Share button → ② Tap "Add to Home Screen"'
                  : '① Tap the ⋮ menu → ② Tap "Add to Home screen"'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
