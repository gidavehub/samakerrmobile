"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { ChevronLeft, Flashlight, Camera, Image as ImageIcon } from 'lucide-react';
import './scanner.css';

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [scanError, setScanError] = useState<string>('');
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [isStarting, setIsStarting] = useState(true);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const scannerStartedRef = useRef(false);
    const router = useRouter();

    const handleValidScan = useCallback((token: string) => {
        setScanResult(token);
        router.push(`/dashboard?token=${token}`);
    }, [router]);

    const startScanner = useCallback(async () => {
        if (scannerStartedRef.current) return;
        scannerStartedRef.current = true;
        setScanError('');
        setError('');
        setIsStarting(true);

        try {
            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState();
                    if (state === 2) await html5QrCodeRef.current.stop();
                } catch { /* ignore */ }
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }

            const html5QrCode = new Html5Qrcode("reader", { verbose: false });
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: window.innerHeight / window.innerWidth,
                },
                (decodedText) => {
                    if (!html5QrCodeRef.current) return;
                    try {
                        const state = html5QrCodeRef.current.getState();
                        if (state === 2) {
                            html5QrCodeRef.current.stop()
                                .then(() => handleValidScan(decodedText))
                                .catch(() => handleValidScan(decodedText));
                        } else {
                            handleValidScan(decodedText);
                        }
                    } catch {
                        handleValidScan(decodedText);
                    }
                },
                () => { }
            );
            setHasPermission(true);
            setIsStarting(false);
        } catch (err: any) {
            console.error("Error starting scanner", err);
            setHasPermission(false);
            setIsStarting(false);
            setError(err.message || "Camera permission denied or camera not found.");
            scannerStartedRef.current = false;
        }
    }, [handleValidScan]);

    useEffect(() => {
        const handleError = (e: ErrorEvent) => setScanError(e.message || 'Unknown Scanner Error');
        const handleRejection = (e: PromiseRejectionEvent) => setScanError(e.reason?.message || String(e.reason));
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        startScanner();

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState();
                    if (state === 2) html5QrCodeRef.current.stop().catch(() => { });
                } catch { /* ignore */ }
                try { html5QrCodeRef.current.clear(); } catch { /* ignore */ }
            }
            scannerStartedRef.current = false;
        };
    }, [startScanner]);

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
                setScanError("Flashlight not supported on this device.");
            }
        } catch (err) { console.error(err); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState();
                    if (state === 2) await html5QrCodeRef.current.stop();
                } catch { /* ignore */ }
            }
            const scanner = html5QrCodeRef.current || new Html5Qrcode("reader", { verbose: false });
            const decodedText = await scanner.scanFile(file, true);
            handleValidScan(decodedText);
        } catch (err: any) {
            console.error("File scan error:", err);
            setScanError(err?.message || "Could not detect a QR Code in that image.");
        }
    };

    const retryScanner = () => {
        scannerStartedRef.current = false;
        startScanner();
    };

    return (
        <main className="h-[100dvh] bg-black flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="h-20 flex items-center px-5 pt-[env(safe-area-inset-top,20px)] bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-20">
                <button
                    onClick={() => router.push('/')}
                    className="p-2.5 -ml-2.5 rounded-full bg-black/30 backdrop-blur-lg flex items-center justify-center"
                >
                    <ChevronLeft size={28} color="white" />
                </button>
            </div>

            <div className="flex-1 relative w-full h-full">
                {/* Camera */}
                <div className="absolute inset-0 z-[1] overflow-hidden">
                    <div id="reader" className="scanner-reader w-full h-full relative"></div>
                </div>

                {/* Overlay UI */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
                    {/* Center: Target */}
                    <div className="flex-1 flex flex-col items-center justify-center pb-[8dvh] animate-fade-slide-up">
                        <div className="w-[250px] h-[250px] relative mb-6 rounded-2xl animate-scan-pulse">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                        </div>
                        <p className="text-white text-sm font-medium text-center max-w-[280px] drop-shadow-lg">
                            Position the QR code inside the frame to connect your property
                        </p>
                    </div>

                    {/* Bottom Controls */}
                    <div className="w-full flex flex-col items-center gap-4 pb-[env(safe-area-inset-bottom,32px)] pt-8 pointer-events-auto z-[15] bg-gradient-to-t from-black/70 to-transparent animate-fade-slide-up-delay">
                        <button
                            onClick={toggleTorch}
                            className={`w-[60px] h-[60px] rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-[0.92] ${isTorchOn
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/20 text-white border-white/30'
                                }`}
                        >
                            <Flashlight size={24} />
                        </button>

                        <div className="flex justify-center w-full">
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-white/70 text-[13px] font-medium flex items-center gap-1.5 underline underline-offset-[3px] active:text-white transition-colors"
                            >
                                <ImageIcon size={16} />
                                Upload QR Image
                            </button>
                        </div>
                    </div>

                    {/* Starting state */}
                    {isStarting && !error && !hasPermission && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white pointer-events-auto z-30 gap-4 animate-fade-in">
                            <div className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spinner"></div>
                            <p>Starting camera...</p>
                        </div>
                    )}

                    {/* Permission needed */}
                    {!isStarting && !hasPermission && !error && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white pointer-events-auto p-8 text-center z-30 gap-4 animate-fade-in">
                            <Camera size={48} className="opacity-50 mb-2" />
                            <p>Camera access is required to scan QR codes.</p>
                            <button onClick={retryScanner} className="mt-3 bg-accent-blue text-white px-7 py-3 rounded-3xl font-semibold text-[15px] active:scale-95 transition-transform">
                                Grant Permission
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-red-400 pointer-events-auto p-8 text-center z-30 animate-fade-in">
                            <p>{error}</p>
                            <button onClick={retryScanner} className="mt-5 bg-accent-blue text-white px-7 py-3 rounded-3xl font-semibold text-[15px] active:scale-95 transition-transform">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Success */}
                    {scanResult && !scanError && (
                        <div className="absolute bottom-36 left-5 right-5 p-4 bg-emerald-500/90 backdrop-blur-lg text-white rounded-xl font-semibold text-center z-50 pointer-events-auto animate-fade-slide-up">
                            <p>QR Code detected. Connecting to property...</p>
                        </div>
                    )}

                    {/* Scrollable Error */}
                    {scanError && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] p-5 pointer-events-auto animate-fade-in">
                            <div className="bg-white text-red-600 rounded-2xl p-6 w-full max-h-[80vh] overflow-y-auto flex flex-col items-center shadow-2xl">
                                <h3 className="mb-3 text-primary-text text-lg font-semibold">Application Error</h3>
                                <p className="text-[13px] break-all text-left w-full mb-5 font-mono whitespace-pre-wrap bg-secondary-bg p-3 rounded-lg border border-border-subtle">
                                    {scanError}
                                </p>
                                <button onClick={() => setScanError('')} className="bg-accent-blue text-white px-7 py-3 rounded-3xl font-semibold text-[15px] active:scale-95 transition-transform">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
