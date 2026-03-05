"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ChevronLeft, Flashlight, Camera } from 'lucide-react';
import gsap from 'gsap';
import styles from './page.module.css';

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Fade in animation
        gsap.fromTo('.animate-in',
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: 'power3.out' }
        );

        // Try to start the scanner directly if we assume they clicked 'Scan Property QR'
        startScanner();

        // Cleanup scanner on unmount
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(e => console.error(e));
                html5QrCodeRef.current.clear();
            }
        };
    }, []);

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: window.innerHeight / window.innerWidth,
                },
                (decodedText) => {
                    html5QrCode.stop();
                    setScanResult(decodedText);
                    handleValidScan(decodedText);
                },
                (err) => {
                    // ignore constant decode failures
                }
            );
            setHasPermission(true);
        } catch (err) {
            console.error("Error starting scanner", err);
            // Permission denied or no camera
            setHasPermission(false);
            setError("Camera permission denied. Please allow camera access in your browser settings to scan the QR code.");
        }
    };

    const toggleTorch = async () => {
        if (!html5QrCodeRef.current || !hasPermission) return;
        try {
            const track = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
            // @ts-ignore
            if (track.hasTorch && track.hasTorch() || track.torch) {
                await html5QrCodeRef.current.applyVideoConstraints({
                    // @ts-ignore
                    advanced: [{ torch: !isTorchOn }]
                });
                setIsTorchOn(!isTorchOn);
            } else {
                alert("Flashlight not supported on this device.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleValidScan = (token: string) => {
        // In a full implementation, you'd check Firebase if `token` exists in `/homes`.
        // If yes, save to localStorage/cookies, and push to dashboard.
        gsap.to('.animate-in', {
            opacity: 0,
            y: -20,
            duration: 0.4,
            onComplete: () => {
                router.push(`/dashboard?token=${token}`);
            }
        });
    };

    return (
        <main className={styles.main}>
            {/* Overlay Header */}
            <div className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <ChevronLeft size={28} color="white" />
                </button>
            </div>

            <div className={`${styles.container} animate-in`}>
                <div id="reader" className={styles.reader}></div>

                {/* Custom Overlay UI */}
                <div className={styles.overlayUI}>
                    <div className={styles.targetSquare}>
                        <div className={styles.cornerTL}></div>
                        <div className={styles.cornerTR}></div>
                        <div className={styles.cornerBL}></div>
                        <div className={styles.cornerBR}></div>
                    </div>

                    <p className={styles.scanText}>Position the QR code inside the frame to connect your property</p>

                    <div className={styles.controls}>
                        <button onClick={toggleTorch} className={`${styles.controlBtn} ${isTorchOn ? styles.torchOn : ''}`}>
                            <Flashlight size={24} />
                        </button>
                    </div>

                    {!hasPermission && !error && (
                        <div className={styles.permissionBox}>
                            <Camera size={48} className="text-white/50 mb-4" />
                            <p>Requesting camera access...</p>
                            <button onClick={startScanner} className={styles.retryBtn}>Grant Permission</button>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorBox}>
                            <p>{error}</p>
                            <button onClick={startScanner} className={styles.retryBtn}>Retry</button>
                        </div>
                    )}

                    {scanResult && (
                        <div className={styles.successMessage}>
                            <p>QR Code detected. Connecting to property...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
