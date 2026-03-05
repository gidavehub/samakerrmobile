"use client";

import { useEffect, Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Home, Zap, Wrench, Bell, Search, Menu, Bot,
    TrendingUp, Receipt, Droplets,
    Building2, ChevronRight, Flame, CreditCard,
    FileText, Eye, MapPin
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

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
            // The token encodes companyId and propertyId as "companyId/propertyId" or just a flat key
            // Try to find across all companies
            const companiesSnap = await get(ref(database, 'companies'));
            if (companiesSnap.exists()) {
                const companies = companiesSnap.val();
                for (const [compId, compData] of Object.entries(companies) as [string, any][]) {
                    const propSnap = await get(ref(database, `properties/${compId}/${id}`));
                    if (propSnap.exists()) {
                        setProperty(propSnap.val());
                        setCompany(compData);
                        // Try to get billing config
                        const billSnap = await get(ref(database, `billing/${compId}/${id}`));
                        if (billSnap.exists()) setBilling(billSnap.val());
                        setLoading(false);
                        return;
                    }
                }
            }
            // Fallback: try legacy homes path
            const legacySnap = await get(ref(database, `homes/${id}`));
            if (legacySnap.exists()) {
                setProperty(legacySnap.val());
            }
        } catch (err) {
            console.error("Failed to fetch property:", err);
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
    const firstName = tenantName.split(' ')[0];
    const propertyLabel = property?.name || `Property`;
    const rentAmount = billing?.rentAmount ? `D ${Number(billing.rentAmount).toLocaleString()}` : 'D 0';
    const maintenanceFee = billing?.maintenanceFee ? `D ${Number(billing.maintenanceFee).toLocaleString()}` : null;
    const paymentModel = billing?.paymentModel || 'rent';
    const brandColor = company?.brandColor1 || '#0A58CA';

    const modelLabels: Record<string, string> = {
        rent: 'Renting',
        mortgage: 'Mortgage',
        installment: 'Installment Plan',
    };

    const aiSuggestions = [
        'Pay my rent',
        'Report a maintenance issue',
        'View my receipts',
        'Track construction progress',
        'Check my utility bills',
    ];

    // Bill cards
    const bills = [
        { id: 'rent', label: paymentModel === 'mortgage' ? 'Mortgage' : paymentModel === 'installment' ? 'Installment' : 'Rent', amount: rentAmount, dueLabel: billing?.rentSchedule === 'quarterly' ? 'Due quarterly' : billing?.rentSchedule === 'annually' ? 'Due annually' : 'Due this month', icon: Home, bg: 'bg-blue-50', iconColor: 'text-blue-600', borderColor: 'border-blue-100', accentColor: 'bg-blue-600' },
        { id: 'electricity', label: 'Electricity', amount: 'D 0', dueLabel: `NAWEC #${property?.nawecCashPower || '—'}`, icon: Zap, bg: 'bg-amber-50', iconColor: 'text-amber-500', borderColor: 'border-amber-100', accentColor: 'bg-amber-500', nawec: true },
        { id: 'water', label: 'Water', amount: 'D 0', dueLabel: `NAWEC #${property?.nawecWaterBill || '—'}`, icon: Droplets, bg: 'bg-sky-50', iconColor: 'text-sky-500', borderColor: 'border-sky-100', accentColor: 'bg-sky-500', nawec: true },
    ];

    if (maintenanceFee) {
        bills.push({ id: 'maintenance', label: 'Maintenance', amount: maintenanceFee, dueLabel: 'Monthly fee', icon: Wrench, bg: 'bg-orange-50', iconColor: 'text-orange-500', borderColor: 'border-orange-100', accentColor: 'bg-orange-500' });
    }
    if (billing?.includeGas) {
        bills.push({ id: 'gas', label: 'Gas', amount: billing.gasFee ? `D ${Number(billing.gasFee).toLocaleString()}` : 'D 0', dueLabel: 'Estimated monthly', icon: Flame, bg: 'bg-rose-50', iconColor: 'text-rose-500', borderColor: 'border-rose-100', accentColor: 'bg-rose-500' });
    }

    return (
        <main className="min-h-screen bg-[#f5f5f5] flex flex-col">
            {/* ────── Header ────── */}
            <div className="bg-gradient-to-br from-[#1b3a5c] to-[#0A58CA] pt-[env(safe-area-inset-top,12px)] px-5 pb-7 relative">
                <div className="h-3" />

                {/* Top Row: Greeting + Company Logo */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-white/60 text-[13px] font-medium">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p>
                        <h1 className="text-white text-[22px] font-bold tracking-tight">{loading ? '...' : firstName}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                            <Bell size={19} className="text-white" />
                        </button>
                        {company?.companyLogo && (
                            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white/30">
                                <img src={company.companyLogo} alt="" className="w-full h-full object-contain" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Property Card */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <Building2 size={17} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-white text-[15px] font-bold leading-tight">{loading ? '...' : propertyLabel}</h2>
                                <p className="text-white/50 text-[12px] font-medium">{property?.address || 'Loading...'}</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white/15 text-white/80 text-[11px] font-semibold">
                            {modelLabels[paymentModel]}
                        </span>
                    </div>
                </div>
            </div>

            {/* ────── Balance Card (Overlapping) ────── */}
            <div className="px-5 -mt-1">
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#e8e8e8]">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[#a19f9d] text-[12px] font-semibold uppercase tracking-wider">Next Payment</p>
                        <span className="text-emerald-500 text-[12px] font-semibold flex items-center gap-0.5"><TrendingUp size={12} /> On track</span>
                    </div>
                    <h2 className="text-[34px] font-extrabold text-[#1b1b1b] tracking-tight leading-none mb-1">
                        {rentAmount}
                    </h2>
                    <p className="text-[13px] text-[#a19f9d]">
                        {billing?.rentSchedule === 'quarterly' ? 'Due next quarter' : billing?.rentSchedule === 'annually' ? 'Due next year' : 'Due 1st of next month'}
                    </p>
                </div>
            </div>

            {/* ────── Bills Section ────── */}
            <div className="px-5 mt-6 flex-1 pb-36">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[18px] font-bold text-[#1b1b1b]">Your Bills</h3>
                    <button className="text-[13px] font-semibold text-[#0A58CA] flex items-center gap-0.5">
                        View All <ChevronRight size={14} />
                    </button>
                </div>

                {/* Bill Cards Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {bills.map((bill) => (
                        <button key={bill.id}
                            className={`${bill.bg} ${bill.borderColor} border rounded-2xl p-4 text-left relative overflow-hidden active:scale-[0.97] transition-transform`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl ${bill.bg} flex items-center justify-center relative`}>
                                    <bill.icon size={18} className={bill.iconColor} />
                                    {(bill as any).nawec && (
                                        <img src="/nawec.jpg" alt="NAWEC" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white object-cover" />
                                    )}
                                </div>
                            </div>
                            <p className="text-[20px] font-extrabold text-[#1b1b1b] mb-0.5">{bill.amount}</p>
                            <p className="text-[13px] font-semibold text-[#1b1b1b] mb-0.5">{bill.label}</p>
                            <p className="text-[11px] text-[#a19f9d] font-medium">{bill.dueLabel}</p>
                            {/* Accent bar */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${bill.accentColor} opacity-40 rounded-b-2xl`} />
                        </button>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[18px] font-bold text-[#1b1b1b]">Quick Actions</h3>
                </div>
                <div className="flex gap-3 mb-6 overflow-x-auto">
                    <button className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e1dfdd] flex items-center justify-center shadow-sm active:bg-[#f3f2f1] transition-colors">
                            <CreditCard size={22} className="text-[#0A58CA]" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#605e5c]">Pay Rent</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e1dfdd] flex items-center justify-center shadow-sm active:bg-[#f3f2f1] transition-colors">
                            <Wrench size={22} className="text-orange-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#605e5c]">Maintenance</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e1dfdd] flex items-center justify-center shadow-sm active:bg-[#f3f2f1] transition-colors">
                            <Receipt size={22} className="text-violet-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#605e5c]">Receipts</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e1dfdd] flex items-center justify-center shadow-sm active:bg-[#f3f2f1] transition-colors">
                            <MapPin size={22} className="text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#605e5c]">Directions</span>
                    </button>
                </div>

                {/* Property Details Card */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden shadow-sm mb-6">
                    <div className="px-4 py-3 bg-[#faf9f8] border-b border-[#e8e8e8] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#a19f9d] uppercase tracking-wider">Property Details</h4>
                        <Eye size={14} className="text-[#c8c6c4]" />
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-[#605e5c]">Property</span>
                            <span className="text-[13px] font-semibold text-[#1b1b1b]">{property?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-[#605e5c]">Address</span>
                            <span className="text-[13px] font-semibold text-[#1b1b1b] text-right max-w-[200px]">{property?.address || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-[#605e5c]">Managed by</span>
                            <span className="text-[13px] font-semibold text-[#1b1b1b]">{company?.companyName || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-[#605e5c]">Payment Type</span>
                            <span className="text-[13px] font-semibold text-[#1b1b1b]">{modelLabels[paymentModel]}</span>
                        </div>
                        {property?.completionState && (
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] text-[#605e5c]">Status</span>
                                <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${property.completionState === 'completed' ? 'bg-emerald-50 text-emerald-700' : property.completionState === 'construction' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {property.completionState === 'completed' ? 'Completed' : property.completionState === 'construction' ? 'Under Construction' : 'Planning'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-[#faf9f8] border-b border-[#e8e8e8]">
                        <h4 className="text-xs font-bold text-[#a19f9d] uppercase tracking-wider">Recent Activity</h4>
                    </div>
                    <div className="p-2">
                        {[
                            { icon: Home, label: 'Rent Payment', date: '01 Mar', amount: rentAmount, type: 'paid', color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                            { icon: Zap, label: 'NAWEC Electricity', date: '28 Feb', amount: 'D 0', type: 'mock', color: 'bg-amber-50', iconColor: 'text-amber-500', nawec: true },
                            { icon: Droplets, label: 'NAWEC Water', date: '28 Feb', amount: 'D 0', type: 'mock', color: 'bg-sky-50', iconColor: 'text-sky-500', nawec: true },
                        ].map((tx, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#faf9f8] transition-colors">
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-xl ${tx.color} flex items-center justify-center`}>
                                        <tx.icon size={18} className={tx.iconColor} />
                                    </div>
                                    {tx.nawec && (
                                        <img src="/nawec.jpg" alt="NAWEC" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[1.5px] border-white object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-[#1b1b1b] truncate">{tx.label}</p>
                                    <p className="text-[11px] text-[#a19f9d]">{tx.date}</p>
                                </div>
                                <span className={`text-[14px] font-bold shrink-0 ${tx.type === 'paid' ? 'text-emerald-600' : 'text-[#a19f9d]'}`}>
                                    {tx.type === 'paid' ? `-${tx.amount}` : tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ────── Floating Rounded Bottom Nav Bar ────── */}
            {!isAiOpen && (
                <nav className="fixed bottom-4 left-4 right-4 z-40">
                    <div className="bg-[#1b3a5c] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
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
            )}

            {/* ────── AI Bottom Sheet ────── */}
            {isAiOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setIsAiOpen(false)}></div>
                    <div
                        className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden animate-sheet-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.08)] bg-[#f3f2f1]/95 backdrop-blur-2xl"
                        style={{ height: '88vh' }}
                    >
                        <div className="w-10 h-[5px] bg-black/10 rounded-full mx-auto mt-3 mb-2"></div>

                        <div className="flex justify-end px-5">
                            <button onClick={() => setIsAiOpen(false)} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                                <span className="text-[#605e5c] text-sm">✕</span>
                            </button>
                        </div>

                        <div className="flex flex-col items-center mt-2 px-6">
                            <div className="relative w-[130px] h-[130px] flex items-center justify-center mb-6">
                                <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 130, height: 130, position: 'absolute', inset: 0 }} />
                                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#0A58CA]/15 backdrop-blur-sm flex items-center justify-center border border-[#0A58CA]/20">
                                    <Bot size={24} className="text-[#0A58CA]" />
                                </div>
                            </div>

                            <h1 className="text-[#1b1b1b] text-[24px] font-semibold text-center leading-tight mb-1">
                                {loading ? '' : `${firstName},`}
                            </h1>
                            <h2 className="text-[#605e5c] text-[20px] font-medium text-center leading-tight mb-8">
                                What do you need help with?
                            </h2>
                        </div>

                        <div className="px-6 mb-5">
                            <div className="bg-white border border-[#e1dfdd] rounded-2xl px-5 py-4">
                                <input type="text" placeholder="Type your request..." className="w-full bg-transparent text-[#1b1b1b] text-[15px] outline-none placeholder-[#a19f9d]" />
                            </div>
                        </div>

                        <div className="flex-1 px-6 overflow-y-auto pb-6">
                            <div className="flex flex-col gap-2.5">
                                {aiSuggestions.map((suggestion, i) => (
                                    <button key={i} className="w-full text-left text-[14px] text-[#605e5c] py-3.5 px-5 rounded-2xl bg-white border border-[#e1dfdd] active:bg-[#f3f2f1] transition-colors">
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav inside AI sheet */}
                        <div className="px-4 pb-4 pt-2">
                            <div className="bg-[#1b3a5c] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
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
            <div className="flex items-center justify-center h-[100dvh] bg-[#f5f5f5] text-[#605e5c]">
                Loading dashboard...
            </div>
        }>
            <ClientDashboardContent />
        </Suspense>
    );
}
