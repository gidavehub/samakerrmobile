"use client";

import { useEffect, Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Home, Zap, Wrench, Bell, Search, Menu, Bot,
    ChevronRight, Flame, CreditCard,
    Building2, Droplets, Receipt, MapPin,
    X, AlertCircle, CheckCircle2, Clock, ArrowUpRight
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
    const firstName = tenantName.split(' ')[0];
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
        <main className="min-h-screen bg-[#f0f0f5] flex flex-col font-inter">

            {/* ── Header ── */}
            <div
                className="pt-[env(safe-area-inset-top,20px)] px-5 pb-8 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, #0f2744 0%, ${brandColor} 100%)` }}
            >
                {/* subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="h-3" />

                {/* Top Row */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        {company?.companyLogo ? (
                            <div className="w-11 h-11 rounded-full bg-white overflow-hidden border-2 border-white/20 shadow-sm">
                                <img src={company.companyLogo} alt={company.companyName} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center border border-white/10 shadow-sm">
                                <Building2 size={20} className="text-white" />
                            </div>
                        )}
                        <div>
                            <p className="text-white/60 text-[11px] font-bold tracking-widest uppercase">
                                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                            </p>
                            <h1 className="text-white text-[22px] font-black tracking-tight leading-none mt-0.5">
                                {loading ? '...' : firstName}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => { setActiveSheet('notifications'); setActiveNav('notifications'); }}
                        className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 active:bg-white/20 transition-colors"
                    >
                        <Bell size={18} className="text-white" />
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-[#0f2744]" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-5 pb-36 space-y-5 relative z-10 -mt-2">

                {/* Property Info Floating Card */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-[18px] bg-[#0081fb]/10 flex items-center justify-center shrink-0">
                                <Building2 size={22} className="text-[#0081fb]" />
                            </div>
                            <div>
                                <h2 className="text-[#1b1b1b] text-[18px] font-extrabold leading-tight tracking-tight">{loading ? '...' : propertyLabel}</h2>
                                <p className="text-[#8a8886] text-[13px] mt-0.5 font-medium">{property?.address || 'Loading...'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/5">
                        <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#c8c6c4]" />
                        <span className="text-[#605e5c] text-[13px] font-bold">{modelLabels[paymentModel]}</span>
                    </div>
                </div>

                {/* Next Payment Hero Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0081fb]/5 rounded-bl-[100px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[12px] font-black text-[#a19f9d] uppercase tracking-widest">Next Payment</p>
                        <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1">
                            <ArrowUpRight size={12} strokeWidth={3} /> On Track
                        </span>
                    </div>
                    <h2 className="text-[44px] font-black tracking-tight leading-none text-[#1b1b1b] mt-2 mb-1">
                        {billing ? formattedRent : '—'}
                    </h2>
                    <p className="text-[14px] font-semibold text-[#8a8886]">{billing ? nextDueLabel : 'No billing configured yet'}</p>

                    {billing && (
                        <div className="mt-6">
                            <button
                                className="w-full py-4 rounded-[20px] text-[15px] font-black text-white transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#0081fb' }}
                            >
                                <CreditCard size={18} /> Pay Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Bill Island Cards */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[19px] font-extrabold text-[#1b1b1b] tracking-tight">Your Bills</h3>
                        <button className="text-[13px] font-black text-[#0081fb] flex items-center gap-0.5 uppercase tracking-wide">
                            Manage
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {bills.map((bill) => {
                            const BillIcon = bill.icon;
                            return (
                                <button key={bill.id}
                                    className={`bg-white rounded-[28px] p-5 text-left relative overflow-hidden active:scale-[0.96] transition-transform shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-white flex flex-col justify-between aspect-square`}>
                                    <div className="flex items-center justify-between">
                                        <div className={`w-11 h-11 rounded-[16px] ${bill.bg} flex items-center justify-center relative`}>
                                            <BillIcon size={22} className={bill.iconColor} />
                                            {bill.nawec && (
                                                <img src="/nawec.jpg" alt="NAWEC" className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 relative z-10">
                                        {bill.isAction ? (
                                            <p className="text-[17px] font-black text-[#0081fb] leading-tight tracking-tight mb-1 flex items-center gap-1">{bill.amount} <ChevronRight size={16} strokeWidth={3} className="mt-0.5" /></p>
                                        ) : (
                                            <p className="text-[22px] font-black text-[#1b1b1b] leading-tight tracking-tight mb-1">{bill.amount}</p>
                                        )}
                                        <p className="text-[14px] font-bold text-[#8a8886] mb-0.5 leading-tight">{bill.label}</p>
                                        <p className="text-[11px] text-[#a19f9d] font-semibold tracking-wide uppercase leading-tight">{bill.dueLabel}</p>
                                    </div>
                                    <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full ${bill.bg} blur-2xl opacity-50`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white">
                    <div className="px-4 py-3 mb-1">
                        <h3 className="text-[16px] font-extrabold text-[#1b1b1b]">Quick Actions</h3>
                    </div>
                    <div className="space-y-1.5">
                        {[
                            { icon: CreditCard, label: 'Pay Rent / Instalment', sub: billing ? `D ${rentAmount.toLocaleString()} · ${scheduleLabel}` : 'No billing set', color: 'text-[#0081fb]', bg: 'bg-[#0081fb]/10' },
                            { icon: Wrench, label: 'Request Maintenance', sub: 'Log a repair or issue', color: 'text-orange-500', bg: 'bg-orange-50' },
                            { icon: Receipt, label: 'View Receipts', sub: 'Your payment history', color: 'text-violet-500', bg: 'bg-violet-50', action: () => setActiveNav('receipts') },
                        ].map((action) => {
                            const ActionIcon = action.icon;
                            return (
                                <button key={action.label}
                                    onClick={action.action}
                                    className="w-full flex items-center gap-4 bg-white/60 rounded-[24px] px-4 py-4 active:bg-white transition-colors text-left border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div className={`w-12 h-12 rounded-[16px] ${action.bg} flex items-center justify-center shrink-0`}>
                                        <ActionIcon size={20} className={action.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-[#1b1b1b]">{action.label}</p>
                                        <p className="text-[12px] font-medium text-[#8a8886] truncate">{action.sub}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-[#a19f9d] shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Property Details Footer Card */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white mt-8 mb-4">
                    <div className="px-4 py-3 border-b border-[#f3f2f1] flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-[#a19f9d] uppercase tracking-widest">Property Details</h4>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            { label: 'Property', value: property?.name || '—' },
                            { label: 'Address', value: property?.address || '—' },
                            { label: 'Managed by', value: company?.companyName || '—' },
                            { label: 'Payment Type', value: modelLabels[paymentModel] },
                            { label: 'Tenant Name', value: property?.tenantName || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center">
                                <span className="text-[13px] text-[#605e5c]">{label}</span>
                                <span className="text-[13px] font-semibold text-[#1b1b1b] text-right max-w-[60%] truncate">{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 pb-4">
                        <button onClick={handleDisconnect}
                            className="w-full py-3.5 rounded-[20px] bg-rose-50 text-[14px] font-black tracking-wide text-rose-500 hover:bg-rose-100 transition-colors">
                            Disconnect Property
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Condensed 3-Button Nav (Home, AI, Receipts) ── */}
            {!isAiOpen && !activeSheet && (
                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit">
                    <div className="bg-[#0081fb] rounded-full flex items-center justify-center py-4 px-6 gap-6 shadow-[0_12px_32px_rgba(0,129,251,0.35)] border border-white/20">
                        <button onClick={() => setActiveNav('home')} className={`p-2 transition-colors ${activeNav === 'home' ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Home size={26} strokeWidth={activeNav === 'home' ? 3 : 2} />
                        </button>
                        {/* Center AI Blob */}
                        <button onClick={() => setIsAiOpen(true)} className="relative -mt-10 -mb-6 mx-2 flex items-center justify-center">
                            <div className="w-[88px] h-[88px] flex items-center justify-center">
                                <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 88, height: 88 }} />
                            </div>
                        </button>
                        <button onClick={() => setActiveNav('receipts')} className={`p-2 transition-colors ${activeNav === 'receipts' ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                            <Receipt size={26} strokeWidth={activeNav === 'receipts' ? 3 : 2} />
                        </button>
                    </div>
                </nav>
            )}

            {/* ── Notifications Sheet ── */}
            {activeSheet === 'notifications' && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => { setActiveSheet(null); setActiveNav('home'); }} />
                    <div className="relative w-full bg-[#f0f0f5] rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[75vh] flex flex-col">
                        <div className="w-10 h-[5px] bg-black/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />
                        <div className="flex items-center justify-between px-5 py-3 shrink-0">
                            <h3 className="text-[18px] font-bold text-[#1b1b1b]">Notifications</h3>
                            <button onClick={() => { setActiveSheet(null); setActiveNav('home'); }} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                                <X size={16} className="text-[#605e5c]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 pb-8">
                            <div className="space-y-2.5">
                                {(() => {
                                    const notifs = billing ? [
                                        { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Billing configured', sub: `${modelLabels[paymentModel]} · ${scheduleLabel}` },
                                        { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', title: `Next payment: ${formattedRent}`, sub: nextDueLabel },
                                    ] : [
                                        { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Billing not configured', sub: 'Contact your property manager' },
                                    ];
                                    return notifs.map((notif, i) => {
                                        const NotifIcon = notif.icon;
                                        return (
                                            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-[#e4e4ef]">
                                                <div className={`w-10 h-10 rounded-xl ${notif.bg} flex items-center justify-center shrink-0`}>
                                                    <NotifIcon size={18} className={notif.color} />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-semibold text-[#1b1b1b]">{notif.title}</p>
                                                    <p className="text-[12px] text-[#a19f9d]">{notif.sub}</p>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        {/* Nav bar stays visible inside sheet */}
                        <div className="px-4 pb-4 pt-2 shrink-0">
                            <div className="bg-[#0f2744] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                                <button onClick={() => { setActiveSheet(null); setActiveNav('home'); }} className="text-white/30 py-2 px-4"><Home size={23} /></button>
                                <button onClick={() => { setActiveSheet('menu'); setActiveNav('menu'); }} className="text-white/30 py-2 px-4"><Menu size={23} /></button>
                                <button onClick={() => { setActiveSheet(null); setIsAiOpen(true); }} className="relative -mt-7 -mb-5 flex items-center justify-center">
                                    <div className="w-[90px] h-[90px]"><DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 90, height: 90 }} /></div>
                                </button>
                                <button className="text-white py-2 px-4"><Bell size={23} /></button>
                                <button onClick={() => setActiveNav('search')} className="text-white/30 py-2 px-4"><Search size={23} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Menu Sheet ── */}
            {activeSheet === 'menu' && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => { setActiveSheet(null); setActiveNav('home'); }} />
                    <div className="relative w-full bg-[#f0f0f5] rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[75vh] flex flex-col">
                        <div className="w-10 h-[5px] bg-black/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />
                        <div className="flex items-center justify-between px-5 py-3 shrink-0">
                            <h3 className="text-[18px] font-bold text-[#1b1b1b]">Menu</h3>
                            <button onClick={() => { setActiveSheet(null); setActiveNav('home'); }} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                                <X size={16} className="text-[#605e5c]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 pb-8">
                            <div className="space-y-2.5">
                                {[
                                    { icon: Home, label: 'My Property', sub: propertyLabel, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { icon: Receipt, label: 'Payment History', sub: 'View all receipts', color: 'text-violet-500', bg: 'bg-violet-50' },
                                    { icon: Wrench, label: 'Maintenance Requests', sub: 'Open tickets', color: 'text-orange-500', bg: 'bg-orange-50' },
                                    { icon: Building2, label: 'Property Info', sub: company?.companyName || '—', color: 'text-teal-500', bg: 'bg-teal-50' },
                                ].map((item) => {
                                    const MenuItem = item.icon;
                                    return (
                                        <button key={item.label} className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 border border-[#e4e4ef] active:bg-[#f8f8fc] transition-colors text-left">
                                            <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                                                <MenuItem size={20} className={item.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-[#1b1b1b]">{item.label}</p>
                                                <p className="text-[11px] text-[#a19f9d] truncate">{item.sub}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-[#c8c6c4] shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-4 pb-4 pt-2 shrink-0">
                            <div className="bg-[#0f2744] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                                <button onClick={() => { setActiveSheet(null); setActiveNav('home'); }} className="text-white/30 py-2 px-4"><Home size={23} /></button>
                                <button className="text-white py-2 px-4"><Menu size={23} /></button>
                                <button onClick={() => { setActiveSheet(null); setIsAiOpen(true); }} className="relative -mt-7 -mb-5 flex items-center justify-center">
                                    <div className="w-[90px] h-[90px]"><DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 90, height: 90 }} /></div>
                                </button>
                                <button onClick={() => { setActiveSheet('notifications'); setActiveNav('notifications'); }} className="text-white/30 py-2 px-4"><Bell size={23} /></button>
                                <button onClick={() => setActiveNav('search')} className="text-white/30 py-2 px-4"><Search size={23} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI Bottom Sheet ── */}
            {isAiOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsAiOpen(false)} />
                    <div className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)] bg-[#f3f2f1]/95 backdrop-blur-2xl" style={{ height: '88vh' }}>
                        <div className="w-10 h-[5px] bg-black/10 rounded-full mx-auto mt-3 mb-2 shrink-0" />
                        <div className="flex justify-end px-5 shrink-0">
                            <button onClick={() => setIsAiOpen(false)} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center">
                                <X size={16} className="text-[#605e5c]" />
                            </button>
                        </div>
                        <div className="flex flex-col items-center mt-2 px-6 shrink-0">
                            <div className="relative w-[130px] h-[130px] flex items-center justify-center mb-6">
                                <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 130, height: 130, position: 'absolute', inset: 0 }} />
                                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#0A58CA]/15 backdrop-blur-sm flex items-center justify-center border border-[#0A58CA]/20">
                                    <Bot size={24} className="text-[#0A58CA]" />
                                </div>
                            </div>
                            <h1 className="text-[#1b1b1b] text-[22px] font-bold text-center leading-tight mb-1">{loading ? '' : `${firstName},`}</h1>
                            <h2 className="text-[#605e5c] text-[18px] font-medium text-center leading-tight mb-6">What do you need help with?</h2>
                        </div>
                        <div className="px-6 mb-5 shrink-0">
                            <div className="bg-white border border-[#e1dfdd] rounded-2xl px-5 py-4 shadow-sm">
                                <input type="text" placeholder="Type your request..." className="w-full bg-transparent text-[#1b1b1b] text-[15px] outline-none placeholder-[#a19f9d]" />
                            </div>
                        </div>
                        <div className="flex-1 px-6 overflow-y-auto pb-8">
                            <div className="flex flex-col gap-2.5">
                                {aiSuggestions.map((suggestion, i) => (
                                    <button key={i} className="w-full text-left text-[14px] text-[#605e5c] py-3.5 px-5 rounded-2xl bg-white border border-[#e1dfdd] active:bg-[#f3f2f1] transition-colors">
                                        {suggestion}
                                    </button>
                                ))}
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
            <div className="flex items-center justify-center h-[100dvh] bg-[#f0f0f5] text-[#605e5c]">
                Loading...
            </div>
        }>
            <ClientDashboardContent />
        </Suspense>
    );
}
