"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { ChevronLeft, Flashlight, Image as ImageIcon, Keyboard, X, Clock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './scanner.css';

interface ScanHistoryItem {
    token: string;
    timestamp: number;
}

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [scanError, setScanError] = useState<string>('');
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [isStarting, setIsStarting] = useState(true);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const scannerStartedRef = useRef(false);
    const router = useRouter();

    // Load scan history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('samakerr_scan_history');
            if (saved) setScanHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveScanToHistory = (token: string) => {
        const newHistory = [
            { token, timestamp: Date.now() },
            ...scanHistory.filter(h => h.token !== token)
        ].slice(0, 5); // Keep last 5
        setScanHistory(newHistory);
        localStorage.setItem('samakerr_scan_history', JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setScanHistory([]);
        localStorage.removeItem('samakerr_scan_history');
    };

    const handleValidScan = useCallback((token: string) => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(100);
        setScanResult(token);
        saveScanToHistory(token);
        router.push(`/dashboard?token=${token}`);
    }, [router, scanHistory]);

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

            // @ts-ignore
            const { Html5QrcodeSupportedFormats } = await import('html5-qrcode');

            const html5QrCode = new Html5Qrcode("reader", {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            });
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
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
                (_) => { /* Searching... */ }
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
        startScanner();
        return () => {
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

    const handleManualSubmit = () => {
        const code = manualCode.trim();
        if (!code) return;
        handleValidScan(code);
    };

    const retryScanner = () => {
        scannerStartedRef.current = false;
        startScanner();
    };

    const timeAgo = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <main className="h-[100dvh] bg-black flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-5 pt-[env(safe-area-inset-top,20px)] bg-gradient-to-b from-black/70 to-transparent absolute top-0 left-0 right-0 z-20">
                <button
                    onClick={() => router.back()}
                    className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-lg flex items-center justify-center active:bg-white/25 transition-colors"
                >
                    <ChevronLeft size={24} color="white" />
                </button>
                <h1 className="text-white text-[17px] font-semibold">Scan QR Code</h1>
                <div className="w-11" /> {/* Spacer */}
            </div>

            <div className="flex-1 relative w-full h-full">
                {/* Camera */}
                <div className="absolute inset-0 z-[1] overflow-hidden">
                    <div id="reader" className="scanner-reader w-full h-full relative"></div>
                </div>

                {/* Overlay UI */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">

                    {/* Scan History Pills */}
                    {scanHistory.length > 0 && !showManualEntry && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-24 px-5 pointer-events-auto z-20"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-[11px] font-bold uppercase tracking-wider">Recent Scans</span>
                                <button onClick={clearHistory} className="text-white/40 active:text-white/70">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {scanHistory.slice(0, 3).map((item) => (
                                    <button
                                        key={item.token}
                                        onClick={() => handleValidScan(item.token)}
                                        className="bg-white/15 backdrop-blur-lg rounded-full px-4 py-2.5 flex items-center gap-2 shrink-0 active:bg-white/25 transition-colors border border-white/10"
                                    >
                                        <Clock size={12} className="text-white/50" />
                                        <span className="text-white text-[12px] font-medium truncate max-w-[100px]">{item.token.slice(0, 12)}...</span>
                                        <span className="text-white/40 text-[10px]">{timeAgo(item.timestamp)}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

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
                        {/* Action Row */}
                        <div className="flex items-center gap-5">
                            {/* Torch */}
                            <button
                                onClick={toggleTorch}
                                className={`w-[56px] h-[56px] rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-[0.92] ${isTorchOn
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/15 text-white border-white/20'
                                    }`}
                            >
                                <Flashlight size={22} />
                            </button>

                            {/* Upload from gallery */}
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-[56px] h-[56px] rounded-full bg-white/15 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center active:scale-[0.92] transition-transform"
                            >
                                <ImageIcon size={22} />
                            </button>

                            {/* Manual entry toggle */}
                            <button
                                onClick={() => setShowManualEntry(!showManualEntry)}
                                className={`w-[56px] h-[56px] rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-[0.92] ${showManualEntry ? 'bg-white text-black border-white' : 'bg-white/15 text-white border-white/20'}`}
                            >
                                <Keyboard size={22} />
                            </button>
                        </div>

                        {/* Manual Entry Input */}
                        {showManualEntry && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full px-6"
                            >
                                <div className="bg-white/10 backdrop-blur-xl rounded-[20px] border border-white/20 p-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                                        placeholder="Enter property code..."
                                        className="flex-1 bg-transparent text-white text-[15px] px-4 py-3.5 outline-none placeholder-white/40 font-medium"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleManualSubmit}
                                        className="bg-white text-black rounded-[16px] px-5 py-3 text-[14px] font-bold shrink-0 active:scale-95 transition-transform"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </motion.div>
                        )}
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
                            <p>Camera access is required to scan QR codes.</p>
                            <button onClick={retryScanner} className="mt-3 bg-white text-black px-7 py-3 rounded-full font-bold text-[15px] active:scale-95 transition-transform">
                                Grant Permission
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-red-400 pointer-events-auto p-8 text-center z-30 animate-fade-in">
                            <p>{error}</p>
                            <button onClick={retryScanner} className="mt-5 bg-white text-black px-7 py-3 rounded-full font-bold text-[15px] active:scale-95 transition-transform">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Success */}
                    {scanResult && !scanError && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-36 left-5 right-5 p-4 bg-[#34C759]/90 backdrop-blur-lg text-white rounded-[20px] font-semibold text-center z-50 pointer-events-auto"
                        >
                            <p>✓ QR Code detected. Connecting to property...</p>
                        </motion.div>
                    )}

                    {/* Scrollable Error */}
                    {scanError && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] p-5 pointer-events-auto animate-fade-in">
                            <div className="bg-white text-red-600 rounded-[24px] p-6 w-full max-h-[80vh] overflow-y-auto flex flex-col items-center shadow-2xl">
                                <h3 className="mb-3 text-[#1b1b1b] text-lg font-semibold">Scanner Error</h3>
                                <p className="text-[13px] break-all text-left w-full mb-5 font-mono whitespace-pre-wrap bg-[#f8f8f8] p-3 rounded-xl border border-[#efefef]">
                                    {scanError}
                                </p>
                                <button onClick={() => setScanError('')} className="bg-[#1b1b1b] text-white px-7 py-3 rounded-full font-bold text-[15px] active:scale-95 transition-transform">
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
