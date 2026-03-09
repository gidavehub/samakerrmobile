"use client";

import { useEffect, Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Home, Zap, Wrench, Bell, Search, Menu, Bot,
    ChevronRight, Flame, CreditCard,
    Building2, Droplets, Receipt, MapPin,
    X, AlertCircle, CheckCircle2, Clock, ArrowUpRight,
    MessageCircleQuestion, ScanLine, FileEdit, RefreshCw, Sparkles, Mic, Layers, User, Headphones
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation variants
const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const slideUpItem: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface PropertyData {
    name?: string;
    address?: string;
    googlePlusCode?: string;
    completionState?: string;
    nawecCashPower?: string;
    nawecWaterBill?: string;
    tenantName?: string;
    notes?: string;
}

interface CompanyData {
    companyName?: string;
    companyLogo?: string;
    brandColor1?: string;
    brandColor2?: string;
    ownerName?: string;
}

interface BillingData {
    rentAmount?: string;
    rentSchedule?: string;
    maintenanceFee?: string;
    includeGas?: boolean;
    gasFee?: string;
    paymentModel?: string;
    installmentTotal?: string;
    installmentMonths?: string;
}

function ClientDashboardContent() {
    const searchParams = useSearchParams();
    const tokenParam = searchParams.get('token');
    const router = useRouter();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [property, setProperty] = useState<PropertyData | null>(null);
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [activeNav, setActiveNav] = useState('home');
    const [activeSheet, setActiveSheet] = useState<null | 'notifications' | 'menu'>(null);

    useEffect(() => {
        if (tokenParam) {
            localStorage.setItem('samakerr_token', tokenParam);
            setToken(tokenParam);
        } else {
            const saved = localStorage.getItem('samakerr_token');
            if (saved) setToken(saved);
            else router.replace('/');
        }
    }, [tokenParam, router]);

    const fetchData = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const companiesSnap = await get(ref(database, 'companies'));
            if (companiesSnap.exists()) {
                const companies = companiesSnap.val();
                for (const [compId, compData] of Object.entries(companies) as [string, any][]) {
                    const propSnap = await get(ref(database, `properties/${compId}/${id}`));
                    if (propSnap.exists()) {
                        setProperty(propSnap.val());
                        setCompany(compData);
                        const billSnap = await get(ref(database, `billing/${compId}/${id}`));
                        if (billSnap.exists()) setBilling(billSnap.val());
                        setLoading(false);
                        return;
                    }
                }
            }
            const legacySnap = await get(ref(database, `homes/${id}`));
            if (legacySnap.exists()) setProperty(legacySnap.val());
        } catch (err) {
            console.error('Failed to fetch property:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchData(token);
    }, [token, fetchData]);

    const handleDisconnect = () => {
        localStorage.removeItem('samakerr_token');
        router.replace('/');
    };

    if (!token) return null;

    const tenantName = property?.tenantName || 'Tenant';
    const fullName = tenantName;
    const propertyLabel = property?.name || 'Your Property';
    const brandColor = company?.brandColor1 || '#0A58CA';
    const paymentModel = billing?.paymentModel || 'rent';
    const rentAmount = billing
        ? (billing.paymentModel === 'installment'
            ? parseFloat(billing.installmentTotal || '0')
            : parseFloat(billing.rentAmount || '0'))
        : 0;
    const formattedRent = `D ${rentAmount.toLocaleString()}`;
    const maintenanceFee = billing?.maintenanceFee ? parseFloat(billing.maintenanceFee) : null;

    const modelLabels: Record<string, string> = {
        rent: 'Renting',
        mortgage: 'Mortgage',
        installment: 'Installment Plan',
    };
    const scheduleLabel = billing?.rentSchedule === 'quarterly' ? 'quarterly' : billing?.rentSchedule === 'annually' ? 'annually' : 'monthly';
    const nextDueLabel = billing?.rentSchedule === 'quarterly' ? 'Due next quarter' : billing?.rentSchedule === 'annually' ? 'Due next year' : 'Due 1st of next month';

    // Build bill cards from billing config
    const bills: { id: string; label: string; amount: string; dueLabel: string; icon: any; bg: string; iconColor: string; border: string; accent: string; nawec?: boolean; isAction?: boolean }[] = [
        {
            id: 'rent', label: paymentModel === 'mortgage' ? 'Mortgage' : paymentModel === 'installment' ? 'Installment' : 'Rent',
            amount: billing ? formattedRent : 'Not set',
            dueLabel: billing ? `Due ${scheduleLabel}` : 'Configure billing',
            icon: Home, bg: 'bg-[#0081fb]/10', iconColor: 'text-[#0081fb]', border: 'border-[#0081fb]/20', accent: 'bg-[#0081fb]'
        },
        {
            id: 'electricity', label: 'Electricity', amount: 'Buy Cashpower',
            dueLabel: property?.nawecCashPower ? `Meter: ${property.nawecCashPower}` : 'Meter not set',
            icon: Zap, bg: 'bg-[#0081fb]/10', iconColor: 'text-[#0081fb]', border: 'border-[#0081fb]/20', accent: 'bg-[#0081fb]', nawec: true, isAction: true
        },
        {
            id: 'water', label: 'Water', amount: 'Pay Bill',
            dueLabel: property?.nawecWaterBill ? `Account: ${property.nawecWaterBill}` : 'Account not set',
            icon: Droplets, bg: 'bg-[#0081fb]/10', iconColor: 'text-[#0081fb]', border: 'border-[#0081fb]/20', accent: 'bg-[#0081fb]', nawec: true, isAction: true
        },
    ];
    if (maintenanceFee) {
        bills.push({ id: 'maintenance', label: 'Maintenance', amount: `D ${maintenanceFee.toLocaleString()}`, dueLabel: 'Monthly fee', icon: Wrench, bg: 'bg-[#0081fb]/10', iconColor: 'text-[#0081fb]', border: 'border-[#0081fb]/20', accent: 'bg-[#0081fb]' });
    }
    // Gas always shown — configured amount if set, otherwise mock placeholder
    bills.push({
        id: 'gas', label: 'Gas Bottle',
        amount: 'Order Refill',
        dueLabel: billing?.includeGas ? 'Est. monthly' : 'Delivery available',
        icon: Flame, bg: 'bg-[#0081fb]/10', iconColor: 'text-[#0081fb]', border: 'border-[#0081fb]/20', accent: 'bg-[#0081fb]', isAction: true
    });

    const aiSuggestions = [
        'When is my next rent payment due?',
        'Report a maintenance issue',
        'View my receipts',
        'Check my utility bills',
        'What is my payment model?',
    ];

    const statusBadge = property?.completionState === 'completed'
        ? { label: 'Ready', color: 'bg-emerald-500/20 text-emerald-200' }
        : property?.completionState === 'construction'
            ? { label: 'Under Construction', color: 'bg-amber-500/20 text-amber-200' }
            : { label: 'Planning', color: 'bg-white/15 text-white/70' };

    return (
        <main className="h-[100dvh] bg-white flex flex-col font-inter relative overflow-hidden">
            <div className="flex-1 flex flex-col justify-center w-full max-w-[500px] mx-auto pb-8">
                {/* Header Area — Sama Kerr Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="px-6 pb-2 flex items-center justify-center z-10 shrink-0"
                >
                    <img src="/logo-blue.png" alt="Sama Kerr" className="h-[72px] object-contain" />
                </motion.div>

                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="px-8 mt-2 mb-6 z-10 shrink-0"
                >
                    <h1 className="text-[38px] font-bold text-[#1b1b1b] leading-[1.05] tracking-[-0.03em]">
                        Hi {loading ? '...' : fullName},<br />
                        How can I help<br />
                        you today?
                    </h1>
                </motion.div>

                {/* 4 Grid Squircle Buttons */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="px-6 grid grid-cols-2 gap-3 mb-6 z-10 shrink-0"
                >
                    {/* 1. My Property / Light Blue */}
                    <motion.button variants={slideUpItem} onClick={() => router.push('/property')} className="bg-[#E4F4F9] rounded-[28px] aspect-[1.3] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                        <Building2 size={26} strokeWidth={1.5} className="text-[#1b1b1b]" />
                        <span className="text-[15px] font-semibold text-[#1b1b1b] tracking-tight">My Property</span>
                    </motion.button>

                    {/* 2. Payments / White + Border */}
                    <motion.button variants={slideUpItem} onClick={() => router.push('/payments')} className="bg-white border border-[#E5E5E5] rounded-[28px] aspect-[1.3] flex flex-col items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
                        <CreditCard size={26} strokeWidth={1.5} className="text-[#1b1b1b]" />
                        <span className="text-[15px] font-semibold text-[#1b1b1b] tracking-tight">Payments</span>
                    </motion.button>

                    {/* 3. Maintenance / Light Green */}
                    <motion.button variants={slideUpItem} onClick={() => router.push('/maintenance')} className="bg-[#E6F5DF] rounded-[28px] aspect-[1.3] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                        <Wrench size={26} strokeWidth={1.5} className="text-[#1b1b1b]" />
                        <span className="text-[15px] font-semibold text-[#1b1b1b] tracking-tight">Maintenance</span>
                    </motion.button>

                    {/* 4. Support / Light Yellow */}
                    <motion.button variants={slideUpItem} onClick={() => router.push('/support')} className="bg-[#FFF6D4] rounded-[28px] aspect-[1.3] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                        <Headphones size={26} strokeWidth={1.5} className="text-[#1b1b1b]" />
                        <span className="text-[15px] font-semibold text-[#1b1b1b] tracking-tight">Support</span>
                    </motion.button>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="px-6 z-10 shrink-0"
                >
                    <div className="bg-white border border-[#E5E5E5] rounded-[100px] flex items-center px-5 py-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <Search size={20} strokeWidth={2.5} className="text-[#a19f9d] shrink-0" />
                        <input
                            type="text"
                            placeholder="Ask or search for anything"
                            className="flex-1 bg-transparent border-none outline-none px-3 text-[16px] font-medium text-[#1b1b1b] placeholder-[#b1afad]"
                        />
                        <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                            <Mic size={20} strokeWidth={2} className="text-[#1b1b1b]" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Split Bottom Nav */}
            <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25, delay: 0.4 }}
                className="fixed bottom-10 left-0 right-0 px-6 flex items-center justify-between z-40 pointer-events-none"
            >
                {/* Left Pill Group */}
                <div className="bg-[#111111] text-white rounded-[100px] flex items-center p-1.5 gap-1.5 shadow-2xl pointer-events-auto">
                    {/* Active Link */}
                    <button className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform">
                        <Layers size={24} strokeWidth={2} fill="currentColor" />
                    </button>
                    {/* Inactive Link */}
                    <button className="w-14 h-14 rounded-full flex items-center justify-center text-white/50 hover:text-white active:scale-95 transition-all shrink-0">
                        <User size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Right Circle (Blob / Action) */}
                <button
                    onClick={() => setIsAiOpen(true)}
                    className="w-[68px] h-[68px] bg-[#111111] text-white rounded-full flex items-center justify-center shadow-2xl pointer-events-auto overflow-hidden relative active:scale-[0.96] transition-transform"
                >
                    {/* Reintroduced the DotLottie React Blob as requested behind the floating plus/AI area */}
                    <div className="absolute inset-0 scale-[2.2] flex items-center justify-center opacity-80 pointer-events-none mix-blend-screen">
                        <DotLottieReact src="/blob.lottie" loop autoplay />
                    </div>
                </button>
            </motion.div>

            {/* ═══════ Full-Screen AI Orb Overlay ═══════ */}
            <AnimatePresence>
                {isAiOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center font-inter"
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => setIsAiOpen(false)}
                            className="absolute top-[env(safe-area-inset-top,44px)] left-5 w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center active:bg-[#e4e4e4] transition-colors z-10"
                        >
                            <X size={22} strokeWidth={2} className="text-[#1b1b1b]" />
                        </motion.button>

                        {/* Giant Orb */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.15 }}
                            className="w-[240px] h-[240px] relative mb-12"
                        >
                            <div className="absolute inset-0 rounded-full bg-[#111111] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
                                <div className="absolute inset-0 scale-[2.2] flex items-center justify-center opacity-90 pointer-events-none mix-blend-screen">
                                    <DotLottieReact src="/blob.lottie" loop autoplay />
                                </div>
                            </div>
                            {/* Pulse rings */}
                            <div className="absolute inset-[-16px] rounded-full border-2 border-[#111111]/8 animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-[-32px] rounded-full border border-[#111111]/4 animate-ping" style={{ animationDuration: '4.5s' }} />
                        </motion.div>

                        {/* Caption */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.5 }}
                            className="text-center px-10"
                        >
                            <h2 className="text-[32px] font-bold text-[#1b1b1b] tracking-tight leading-tight mb-3">
                                Sama AI
                            </h2>
                            <p className="text-[16px] text-[#8a8886] font-medium leading-relaxed max-w-[300px] mx-auto">
                                Your intelligent property assistant — always listening, always helping.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

export default function ClientDashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[100dvh] bg-[#f0f0f5] text-[#605e5c]">
                Loading...
            </div>
        }>
            <ClientDashboardContent />
        </Suspense>
    );
}
