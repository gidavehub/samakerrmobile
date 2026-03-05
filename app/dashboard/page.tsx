"use client";

import { useEffect, Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Home, Zap, Wrench, Bell, Search, Menu, Bot,
    TrendingUp, Receipt, Wallet, DollarSign, Droplets,
    FileText, Building2, CircleDollarSign,
    ChevronRight
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface PropertyData {
    propertyName?: string;
    ownerName?: string;
    address?: string;
    electricityId?: string;
    waterId?: string;
    status?: string;
    companyName?: string;
    companyLogo?: string;
    brandColor1?: string;
    brandColor2?: string;
}

function ClientDashboardContent() {
    const searchParams = useSearchParams();
    const tokenParam = searchParams.get('token');
    const router = useRouter();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [property, setProperty] = useState<PropertyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [activeNav, setActiveNav] = useState('home');
    const [activeTab, setActiveTab] = useState('activity');

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

    const fetchProperty = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const snapshot = await get(ref(database, `homes/${id}`));
            if (snapshot.exists()) setProperty(snapshot.val());
            else setProperty(null);
        } catch (err) {
            console.error("Failed to fetch property:", err);
            setProperty(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchProperty(token);
    }, [token, fetchProperty]);

    const handleDisconnect = () => {
        localStorage.removeItem('samakerr_token');
        router.replace('/');
    };

    if (!token) return null;

    const displayName = property?.ownerName || 'Homeowner';
    const firstName = displayName.split(' ')[0];
    const propertyLabel = property?.propertyName || `Property ${token.substring(0, 5).toUpperCase()}`;

    const aiSuggestions = [
        'Pay my electricity bill',
        'Report a maintenance issue',
        'Show my property documents',
        'Track construction progress',
        'Find directions to my home',
    ];

    const transactions = [
        { icon: Zap, iconBg: 'bg-amber-100', iconColor: '#f59e0b', label: 'NAWEC Electricity', sub: 'Today, 09:41 AM', amount: '-D 1,250', amountColor: 'text-red-500' },
        { icon: Droplets, iconBg: 'bg-blue-100', iconColor: '#3b82f6', label: 'NAWEC Water', sub: '28 Feb, 14:20', amount: '-D 450', amountColor: 'text-red-500' },
        { icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: '#10b981', label: 'Rent Payment', sub: '01 Mar, 08:00', amount: '+D 25,000', amountColor: 'text-emerald-600' },
        { icon: Wrench, iconBg: 'bg-orange-100', iconColor: '#f97316', label: 'Plumbing Repair', sub: '25 Feb, 16:45', amount: '-D 3,500', amountColor: 'text-red-500' },
        { icon: Building2, iconBg: 'bg-violet-100', iconColor: '#8b5cf6', label: 'Construction Phase 2', sub: '20 Feb, 10:00', amount: '-D 85,000', amountColor: 'text-red-500' },
    ];

    return (
        <main className="min-h-screen bg-[#e8e6df] flex flex-col pb-28">
            {/* ────── Hero Section (sage green area) ────── */}
            <div className="bg-[#c5c9a4] rounded-b-[36px] pt-[env(safe-area-inset-top,12px)] px-5 pb-8 relative overflow-visible">

                {/* Status bar spacer */}
                <div className="h-2"></div>

                {/* Property Card + Action Buttons */}
                <div className="flex gap-3 mb-6">
                    {/* Property Card */}
                    <div className="flex-1 bg-gradient-to-br from-[#f5e6c8] to-[#e8d5a8] rounded-[22px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[17px] font-bold text-[#3d3520]">
                                {loading ? '...' : displayName}
                            </h2>
                            <div className="w-8 h-8 rounded-full bg-[#3d3520]/10 flex items-center justify-center">
                                <Building2 size={16} color="#3d3520" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[#3d3520]/70 text-[13px] font-medium">
                            <span>•••• {token?.substring(0, 4).toUpperCase()}</span>
                            <span>{propertyLabel}</span>
                        </div>
                    </div>

                    {/* Floating Action Buttons */}
                    <div className="flex flex-col gap-2.5">
                        <button className="w-[52px] h-[52px] rounded-[18px] bg-[#b8bda0] border-2 border-dashed border-[#8a8f72] flex items-center justify-center">
                            <span className="text-[#5c6148] text-2xl font-light">+</span>
                        </button>
                        <button className="w-[52px] h-[52px] rounded-[18px] bg-[#a8a0e0] flex items-center justify-center shadow-sm">
                            <FileText size={20} color="white" />
                        </button>
                        <button className="w-[52px] h-[52px] rounded-[18px] bg-[#c5c9a4] border border-[#b0b48e] flex items-center justify-center shadow-sm">
                            <Receipt size={20} color="#5c6148" />
                        </button>
                    </div>
                </div>

                {/* Balance */}
                <div className="mb-5">
                    <p className="text-[13px] text-[#5c6148] font-medium mb-1">Balance</p>
                    <h1 className="text-[40px] font-bold text-[#2c2c1e] leading-none mb-1">
                        D 25,000
                    </h1>
                    <p className="text-[13px] text-emerald-700 font-semibold flex items-center gap-1">
                        <TrendingUp size={14} /> Rent Paid +100%
                    </p>
                </div>

                {/* Stats Row */}
                <div className="flex justify-between">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-[#e8d5c0] flex items-center justify-center">
                            <Wallet size={18} color="#a86c3e" />
                        </div>
                        <span className="text-[11px] text-[#5c6148] font-medium">Spent</span>
                        <span className="text-[14px] font-bold text-[#2c2c1e]">D 5,200</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-[#c5ddc0] flex items-center justify-center">
                            <CircleDollarSign size={18} color="#4a8c3e" />
                        </div>
                        <span className="text-[11px] text-[#5c6148] font-medium">Earned</span>
                        <span className="text-[14px] font-bold text-[#2c2c1e]">D 25,000</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-11 h-11 rounded-full bg-[#d0cec0] flex items-center justify-center">
                            <Zap size={18} color="#6b6952" />
                        </div>
                        <span className="text-[11px] text-[#5c6148] font-medium">Utilities</span>
                        <span className="text-[14px] font-bold text-[#2c2c1e]">D 1,700</span>
                    </div>
                </div>
            </div>

            {/* ────── Transactions Section ────── */}
            <div className="px-5 mt-6 flex-1">
                {/* Tabs */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`text-[20px] font-bold transition-colors ${activeTab === 'activity' ? 'text-[#2c2c1e]' : 'text-[#2c2c1e]/30'}`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`text-[16px] font-medium transition-colors ${activeTab === 'analytics' ? 'text-[#2c2c1e]' : 'text-[#2c2c1e]/30'}`}
                    >
                        Analytics
                    </button>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-black/[0.04]">
                    {transactions.map(({ icon: Icon, iconBg, iconColor, label, sub, amount, amountColor }, i) => (
                        <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < transactions.length - 1 ? 'border-b border-black/[0.04]' : ''}`}>
                            <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={20} color={iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-semibold text-[#1a1a1a] truncate">{label}</p>
                                <p className="text-[12px] text-[#999] font-medium">{sub}</p>
                            </div>
                            <span className={`text-[15px] font-bold ${amountColor} flex-shrink-0`}>{amount}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ────── Floating Rounded Bottom Nav Bar ────── */}
            <nav className="fixed bottom-4 left-4 right-4 z-40">
                <div className="bg-[#2c2c1e] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                    <button
                        onClick={() => setActiveNav('home')}
                        className={`py-2 px-4 rounded-2xl transition-colors ${activeNav === 'home' ? 'text-white' : 'text-white/35'}`}
                    >
                        <Home size={23} />
                    </button>
                    <button
                        onClick={() => setActiveNav('menu')}
                        className={`py-2 px-4 rounded-2xl transition-colors ${activeNav === 'menu' ? 'text-white' : 'text-white/35'}`}
                    >
                        <Menu size={23} />
                    </button>

                    {/* Center AI Blob */}
                    <button
                        onClick={() => setIsAiOpen(true)}
                        className="relative -mt-7 -mb-5 flex items-center justify-center"
                    >
                        <div className="w-[90px] h-[90px] flex items-center justify-center">
                            <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 90, height: 90 }} />
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveNav('notifications')}
                        className={`py-2 px-4 rounded-2xl transition-colors ${activeNav === 'notifications' ? 'text-white' : 'text-white/35'}`}
                    >
                        <Bell size={23} />
                    </button>
                    <button
                        onClick={() => setActiveNav('search')}
                        className={`py-2 px-4 rounded-2xl transition-colors ${activeNav === 'search' ? 'text-white' : 'text-white/35'}`}
                    >
                        <Search size={23} />
                    </button>
                </div>
            </nav>

            {/* ────── AI Bottom Sheet ────── */}
            {isAiOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setIsAiOpen(false)}></div>
                    <div
                        className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden animate-sheet-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.08)] bg-[#f7f6f2]/95 backdrop-blur-2xl"
                        style={{ height: '88vh' }}
                    >
                        <div className="w-10 h-[5px] bg-black/10 rounded-full mx-auto mt-3 mb-2"></div>

                        <div className="flex justify-end px-5">
                            <button onClick={() => setIsAiOpen(false)} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                                <span className="text-[#5c6148] text-sm">✕</span>
                            </button>
                        </div>

                        <div className="flex flex-col items-center mt-2 px-6">
                            <div className="relative w-[130px] h-[130px] flex items-center justify-center mb-6">
                                <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 130, height: 130, position: 'absolute', inset: 0 }} />
                                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#c5c9a4]/30 backdrop-blur-sm flex items-center justify-center border border-[#c5c9a4]/40">
                                    <Bot size={24} className="text-[#5c6148]" />
                                </div>
                            </div>

                            <h1 className="text-[#2c2c1e] text-[24px] font-semibold text-center leading-tight mb-1">
                                {loading ? '' : `${firstName},`}
                            </h1>
                            <h2 className="text-[#5c6148] text-[20px] font-medium text-center leading-tight mb-8">
                                What do you need help with?
                            </h2>
                        </div>

                        <div className="px-6 mb-5">
                            <div className="bg-white border border-black/[0.06] rounded-2xl px-5 py-4">
                                <input type="text" placeholder="Type your request..." className="w-full bg-transparent text-[#2c2c1e] text-[15px] outline-none placeholder-[#999]" />
                            </div>
                        </div>

                        <div className="flex-1 px-6 overflow-y-auto pb-6">
                            <div className="flex flex-col gap-2.5">
                                {aiSuggestions.map((suggestion, i) => (
                                    <button key={i} className="w-full text-left text-[14px] text-[#5c6148] py-3.5 px-5 rounded-2xl bg-white border border-black/[0.04] active:bg-[#f0efea] transition-colors">
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 pb-4 pt-2">
                            <div className="bg-[#2c2c1e] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                                <button onClick={() => { setIsAiOpen(false); setActiveNav('home'); }} className="text-white/35 py-2 px-4"><Home size={23} /></button>
                                <button onClick={() => { setIsAiOpen(false); setActiveNav('menu'); }} className="text-white/35 py-2 px-4"><Menu size={23} /></button>
                                <button className="relative -mt-7 -mb-5 flex items-center justify-center">
                                    <div className="w-[90px] h-[90px] flex items-center justify-center">
                                        <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 90, height: 90 }} />
                                    </div>
                                </button>
                                <button onClick={() => { setIsAiOpen(false); setActiveNav('notifications'); }} className="text-white/35 py-2 px-4"><Bell size={23} /></button>
                                <button onClick={() => { setIsAiOpen(false); setActiveNav('search'); }} className="text-white/35 py-2 px-4"><Search size={23} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function ClientDashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[100dvh] bg-[#e8e6df] text-[#5c6148]">
                Loading dashboard...
            </div>
        }>
            <ClientDashboardContent />
        </Suspense>
    );
}
