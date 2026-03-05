"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ChevronLeft, Home } from 'lucide-react';
import gsap from 'gsap';
import styles from './page.module.css';

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        // Fade in animation
        gsap.fromTo('.animate-in',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
        );

        // Initialize QR Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            false // non-verbose
        );

        scanner.render(
            (decodedText) => {
                // Stop scanning upon success
                scanner.clear();
                setScanResult(decodedText);
                // Here we would typically validate the token against Firebase.
                // For demonstration, we simply route to the client dashboard with the token.
                handleValidScan(decodedText);
            },
            (err) => {
                // Note: this callback fires constantly when it doesn't see a QR code.
                // We only want to log actual hard failures, but for now we ignore standard decode errors.
            }
        );

        // Cleanup scanner on unmount
        return () => {
            scanner.clear().catch(e => console.error("Failed to clear scanner", e));
        };
    }, []);

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
            <div className={styles.header}>
                <button onClick={() => router.push('/')} className={styles.backButton}>
                    <ChevronLeft size={24} color="var(--text-primary)" />
                </button>
                <span className={styles.headerTitle}>Connect Home</span>
            </div>

            <div className={styles.container}>
                <div className={`${styles.scannerWrapper} animate-in`}>
                    <div className={styles.scannerHeader}>
                        <Home size={28} color="var(--accent-blue)" />
                        <h2>Scan Property Code</h2>
                        <p>Point your camera at the QR code given by your property manager.</p>
                    </div>

                    <div className={styles.readerContainer}>
                        <div id="reader" className={styles.reader}></div>
                    </div>

                    {scanResult && (
                        <div className={styles.successMessage}>
                            <p>QR Code detected. Connecting to property...</p>
                        </div>
                    )}
                    {error && <div className={styles.errorMessage}>{error}</div>}
                </div>
            </div>
        </main>
    );
}
