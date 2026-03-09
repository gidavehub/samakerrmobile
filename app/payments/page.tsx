"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Zap, Droplets, Flame, Wrench, Receipt,
    ChevronRight, CreditCard, ArrowUpRight, Home
} from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { motion, Variants } from 'framer-motion';

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const slideUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface PropertyData {
    name?: string;
    address?: string;
    nawecCashPower?: string;
    nawecWaterBill?: string;
    tenantName?: string;
}

interface BillingData {
    rentAmount?: string;
    rentSchedule?: string;
    paymentModel?: string;
    maintenanceFee?: string;
    includeGas?: boolean;
    gasFee?: string;
    installmentTotal?: string;
}

export default function PaymentsPage() {
    const router = useRouter();
    const [property, setProperty] = useState<PropertyData | null>(null);
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'bills' | 'receipts'>('bills');

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('samakerr_token');
        if (!token) { router.replace('/'); return; }
        setLoading(true);
        try {
            const companiesSnap = await get(ref(database, 'companies'));
            if (companiesSnap.exists()) {
                const companies = companiesSnap.val();
                for (const [compId, compData] of Object.entries(companies) as [string, any][]) {
                    const propSnap = await get(ref(database, `properties/${compId}/${token}`));
                    if (propSnap.exists()) {
                        setProperty(propSnap.val());
                        const billSnap = await get(ref(database, `billing/${compId}/${token}`));
                        if (billSnap.exists()) setBilling(billSnap.val());
                        setLoading(false);
                        return;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const paymentModel = billing?.paymentModel || 'rent';
    const rentAmount = billing
        ? (billing.paymentModel === 'installment'
            ? parseFloat(billing.installmentTotal || '0')
            : parseFloat(billing.rentAmount || '0'))
        : 0;
    const formattedRent = `D ${rentAmount.toLocaleString()}`;
    const scheduleLabel = billing?.rentSchedule === 'quarterly' ? 'Quarterly' : billing?.rentSchedule === 'annually' ? 'Annually' : 'Monthly';
    const maintenanceFee = billing?.maintenanceFee ? parseFloat(billing.maintenanceFee) : null;

    const modelLabels: Record<string, string> = { rent: 'Rent', mortgage: 'Mortgage', installment: 'Installment' };

    // Mock receipts (would come from Firebase transactions in production)
    const mockReceipts = [
        { id: '1', label: 'Rent Payment', amount: formattedRent, date: 'Mar 1, 2026', status: 'Paid', icon: Home },
        { id: '2', label: 'Electricity (Cashpower)', amount: 'D 500', date: 'Feb 28, 2026', status: 'Paid', icon: Zap },
        { id: '3', label: 'Water Bill', amount: 'D 350', date: 'Feb 15, 2026', status: 'Paid', icon: Droplets },
        { id: '4', label: 'Maintenance Fee', amount: maintenanceFee ? `D ${maintenanceFee.toLocaleString()}` : 'D 200', date: 'Feb 1, 2026', status: 'Paid', icon: Wrench },
        { id: '5', label: 'Rent Payment', amount: formattedRent, date: 'Feb 1, 2026', status: 'Paid', icon: Home },
    ];

    if (loading) {
        return (
            <main className="min-h-[100dvh] bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-[#E5E5E5] border-t-[#1b1b1b] rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-white flex flex-col font-inter pb-16">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="px-5 pt-[calc(env(safe-area-inset-top,40px)+16px)] pb-3 flex items-center gap-3 z-10"
            >
                <button onClick={() => router.back()} className="w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center active:bg-[#e4e4e4] transition-colors">
                    <ChevronLeft size={24} strokeWidth={2} className="text-[#1b1b1b]" />
                </button>
                <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">Payments & Bills</h1>
            </motion.div>

            {/* Tab Switcher */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="px-6 mb-6"
            >
                <div className="bg-[#f5f5f5] rounded-[20px] p-1.5 flex">
                    <button
                        onClick={() => setActiveTab('bills')}
                        className={`flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all ${activeTab === 'bills' ? 'bg-white text-[#1b1b1b] shadow-sm' : 'text-[#8a8886]'}`}
                    >
                        Bills
                    </button>
                    <button
                        onClick={() => setActiveTab('receipts')}
                        className={`flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all ${activeTab === 'receipts' ? 'bg-white text-[#1b1b1b] shadow-sm' : 'text-[#8a8886]'}`}
                    >
                        Receipts
                    </button>
                </div>
            </motion.div>

            {/* Bills Tab */}
            {activeTab === 'bills' && (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="flex-1 px-6 space-y-5"
                >
                    {/* Next Payment Card */}
                    <motion.div variants={slideUp} className="bg-[#E4F4F9] rounded-[28px] p-6 relative overflow-hidden">
                        <p className="text-[12px] font-bold text-[#1b1b1b]/50 uppercase tracking-wider mb-1">Next Payment</p>
                        <h2 className="text-[38px] font-bold text-[#1b1b1b] tracking-tight leading-none mb-1">
                            {billing ? formattedRent : '—'}
                        </h2>
                        <p className="text-[14px] text-[#1b1b1b]/60 font-medium mb-5">
                            {modelLabels[paymentModel]} · {scheduleLabel}
                        </p>
                        {billing && (
                            <button className="w-full bg-[#1b1b1b] text-white py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                                <CreditCard size={18} /> Pay Now
                            </button>
                        )}
                    </motion.div>

                    {/* Utility Bills Grid */}
                    <motion.div variants={slideUp}>
                        <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Utility Bills</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* NAWEC Electricity / Cashpower */}
                            <button className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 flex flex-col items-start gap-3 active:scale-[0.98] transition-transform shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-11 h-11 rounded-[14px] bg-[#FFF6D4] flex items-center justify-center shrink-0">
                                        <Zap size={22} className="text-[#1b1b1b]" />
                                    </div>
                                    <img src="/nawec.jpg" alt="NAWEC" className="w-7 h-7 rounded-full object-cover border border-[#E5E5E5] shadow-sm" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[#1b1b1b] leading-tight">Cashpower</p>
                                    <p className="text-[11px] text-[#8a8886] font-medium mt-0.5">
                                        {property?.nawecCashPower ? `Meter: ${property.nawecCashPower}` : 'Meter not set'}
                                    </p>
                                </div>
                                <span className="text-[13px] font-bold text-[#1b1b1b] flex items-center gap-0.5">
                                    Buy <ChevronRight size={14} strokeWidth={3} />
                                </span>
                            </button>

                            {/* NAWEC Water */}
                            <button className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 flex flex-col items-start gap-3 active:scale-[0.98] transition-transform shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-11 h-11 rounded-[14px] bg-[#E4F4F9] flex items-center justify-center shrink-0">
                                        <Droplets size={22} className="text-[#1b1b1b]" />
                                    </div>
                                    <img src="/nawec.jpg" alt="NAWEC" className="w-7 h-7 rounded-full object-cover border border-[#E5E5E5] shadow-sm" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[#1b1b1b] leading-tight">Water Bill</p>
                                    <p className="text-[11px] text-[#8a8886] font-medium mt-0.5">
                                        {property?.nawecWaterBill ? `Account: ${property.nawecWaterBill}` : 'Account not set'}
                                    </p>
                                </div>
                                <span className="text-[13px] font-bold text-[#1b1b1b] flex items-center gap-0.5">
                                    Pay <ChevronRight size={14} strokeWidth={3} />
                                </span>
                            </button>

                            {/* Gas Bottle */}
                            <button className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 flex flex-col items-start gap-3 active:scale-[0.98] transition-transform shadow-sm">
                                <div className="w-11 h-11 rounded-[14px] bg-[#FFE8E0] flex items-center justify-center">
                                    <Flame size={22} className="text-[#1b1b1b]" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[#1b1b1b] leading-tight">Gas Bottle</p>
                                    <p className="text-[11px] text-[#8a8886] font-medium mt-0.5">
                                        {billing?.includeGas ? 'Included in plan' : 'Order refill'}
                                    </p>
                                </div>
                                <span className="text-[13px] font-bold text-[#1b1b1b] flex items-center gap-0.5">
                                    Order <ChevronRight size={14} strokeWidth={3} />
                                </span>
                            </button>

                            {/* Maintenance */}
                            {maintenanceFee && (
                                <button className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 flex flex-col items-start gap-3 active:scale-[0.98] transition-transform shadow-sm">
                                    <div className="w-11 h-11 rounded-[14px] bg-[#E6F5DF] flex items-center justify-center">
                                        <Wrench size={22} className="text-[#1b1b1b]" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-[#1b1b1b] leading-tight">Maintenance</p>
                                        <p className="text-[11px] text-[#8a8886] font-medium mt-0.5">Monthly fee</p>
                                    </div>
                                    <span className="text-[15px] font-bold text-[#1b1b1b]">D {maintenanceFee.toLocaleString()}</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Receipts Tab */}
            {activeTab === 'receipts' && (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="flex-1 px-6 space-y-3"
                >
                    <motion.div variants={slideUp} className="flex items-center justify-between px-1 mb-1">
                        <h3 className="text-[17px] font-bold text-[#1b1b1b]">Transaction History</h3>
                        <span className="text-[12px] text-[#8a8886] font-medium">{mockReceipts.length} transactions</span>
                    </motion.div>

                    {mockReceipts.map((receipt) => {
                        const ReceiptIcon = receipt.icon;
                        return (
                            <motion.div key={receipt.id} variants={slideUp}>
                                <button className="w-full bg-white border border-[#E5E5E5] rounded-[22px] p-4 flex items-center gap-4 active:bg-[#fafafa] transition-colors text-left shadow-sm">
                                    <div className="w-12 h-12 rounded-[16px] bg-[#f5f5f5] flex items-center justify-center shrink-0">
                                        <ReceiptIcon size={20} className="text-[#1b1b1b]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-semibold text-[#1b1b1b] leading-tight">{receipt.label}</p>
                                        <p className="text-[12px] text-[#8a8886] font-medium mt-0.5">{receipt.date}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[15px] font-bold text-[#1b1b1b]">{receipt.amount}</p>
                                        <p className="text-[11px] font-semibold text-[#34C759]">{receipt.status}</p>
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </main>
    );
}
