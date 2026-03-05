"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Search, Zap, Droplets, DollarSign, Wrench,
    AlertTriangle, CheckCircle2, Clock, Home, Menu, Bell, Bot
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type Tab = 'all' | 'bills' | 'complaints';

const bills = [
    { id: 1, icon: Zap, iconBg: 'bg-amber-100', iconColor: '#f59e0b', service: 'NAWEC Electricity', period: 'Feb 2026', amount: 'D 1,250', status: 'paid' as const },
    { id: 2, icon: Droplets, iconBg: 'bg-blue-100', iconColor: '#3b82f6', service: 'NAWEC Water', period: 'Feb 2026', amount: 'D 450', status: 'paid' as const },
    { id: 3, icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: '#10b981', service: 'Rent Payment', period: 'March 2026', amount: 'D 25,000', status: 'paid' as const },
    { id: 4, icon: Zap, iconBg: 'bg-amber-100', iconColor: '#f59e0b', service: 'NAWEC Electricity', period: 'Jan 2026', amount: 'D 1,180', status: 'paid' as const },
];

const complaints = [
    { id: 1, icon: Wrench, iconBg: 'bg-orange-100', iconColor: '#f97316', title: 'Plumbing Leak — Kitchen', date: '25 Feb 2026', status: 'resolved' as const, desc: 'Kitchen sink pipe was leaking. Plumber dispatched and fixed same day.' },
    { id: 2, icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: '#ef4444', title: 'Electrical Fault — Bedroom', date: '18 Feb 2026', status: 'in-progress' as const, desc: 'Socket in the master bedroom sparks when appliances are plugged in.' },
    { id: 3, icon: Wrench, iconBg: 'bg-orange-100', iconColor: '#f97316', title: 'Broken Window Latch', date: '10 Jan 2026', status: 'open' as const, desc: 'Living room window latch is broken, window cannot be secured.' },
];

function StatusBadge({ status }: { status: 'paid' | 'open' | 'in-progress' | 'resolved' }) {
    const styles = {
        paid: 'bg-emerald-100 text-emerald-700',
        open: 'bg-red-100 text-red-600',
        'in-progress': 'bg-amber-100 text-amber-700',
        resolved: 'bg-emerald-100 text-emerald-700',
    };
    const labels = { paid: 'Paid', open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' };
    return (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

export default function HistoryPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('all');
    const [activeNav, setActiveNav] = useState('menu');

    const tabs: { key: Tab; label: string }[] = [
        { key: 'bills', label: 'BILLS' },
        { key: 'complaints', label: 'COMPLAINTS' },
        { key: 'all', label: 'ALL' },
    ];

    return (
        <main className="min-h-screen bg-[#e8e6df] flex flex-col pb-28">
            {/* Header */}
            <div className="bg-[#c5c9a4] pt-[env(safe-area-inset-top,12px)] px-5 pb-6 rounded-b-[32px]">
                <div className="h-2"></div>
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[#2c2c1e]/10 flex items-center justify-center">
                        <ChevronLeft size={22} color="#2c2c1e" />
                    </button>
                    <h1 className="text-[20px] font-bold text-[#2c2c1e]">History</h1>
                    <button className="w-9 h-9 rounded-full bg-[#2c2c1e]/10 flex items-center justify-center">
                        <Search size={18} color="#2c2c1e" />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {tabs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${tab === key
                                    ? 'bg-[#2c2c1e] text-white'
                                    : 'bg-[#2c2c1e]/10 text-[#2c2c1e]'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 mt-5 flex-1 flex flex-col gap-3">
                {/* Bills */}
                {(tab === 'all' || tab === 'bills') && bills.map((bill) => (
                    <div key={`bill-${bill.id}`} className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                        <div className="flex items-start gap-4">
                            <div className={`w-11 h-11 rounded-full ${bill.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <bill.icon size={20} color={bill.iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[15px] font-semibold text-[#1a1a1a]">{bill.service}</p>
                                    <StatusBadge status={bill.status} />
                                </div>
                                <p className="text-[12px] text-[#999] mb-3">{bill.period}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[18px] font-bold text-[#2c2c1e]">{bill.amount}</span>
                                    <button className="text-[12px] font-semibold text-[#5c6148] underline underline-offset-2">
                                        View Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Complaints */}
                {(tab === 'all' || tab === 'complaints') && complaints.map((c) => (
                    <div key={`comp-${c.id}`} className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                        <div className="flex items-start gap-4">
                            <div className={`w-11 h-11 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <c.icon size={20} color={c.iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[15px] font-semibold text-[#1a1a1a]">{c.title}</p>
                                    <StatusBadge status={c.status} />
                                </div>
                                <p className="text-[12px] text-[#999] mb-2">{c.date}</p>
                                <p className="text-[13px] text-[#666] leading-relaxed mb-3">{c.desc}</p>
                                <button className="text-[12px] font-semibold text-[#5c6148] underline underline-offset-2">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Nav Bar */}
            <nav className="fixed bottom-4 left-4 right-4 z-40">
                <div className="bg-[#2c2c1e] rounded-[28px] flex items-center justify-around py-3.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                    <button onClick={() => { setActiveNav('home'); router.push('/dashboard'); }} className={`py-2 px-4 transition-colors ${activeNav === 'home' ? 'text-white' : 'text-white/35'}`}>
                        <Home size={23} />
                    </button>
                    <button onClick={() => setActiveNav('menu')} className={`py-2 px-4 transition-colors ${activeNav === 'menu' ? 'text-white' : 'text-white/35'}`}>
                        <Menu size={23} />
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="relative -mt-7 -mb-5 flex items-center justify-center">
                        <div className="w-[90px] h-[90px] flex items-center justify-center">
                            <DotLottieReact src="/blob.lottie" loop autoplay style={{ width: 90, height: 90 }} />
                        </div>
                    </button>
                    <button onClick={() => setActiveNav('notifications')} className={`py-2 px-4 transition-colors ${activeNav === 'notifications' ? 'text-white' : 'text-white/35'}`}>
                        <Bell size={23} />
                    </button>
                    <button onClick={() => setActiveNav('search')} className={`py-2 px-4 transition-colors ${activeNav === 'search' ? 'text-white' : 'text-white/35'}`}>
                        <Search size={23} />
                    </button>
                </div>
            </nav>
        </main>
    );
}
