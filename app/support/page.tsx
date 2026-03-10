"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, MessageSquare, Phone, Mail, FileText, HelpCircle,
    ChevronRight, Send, ExternalLink, Shield, BookOpen, Clock,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const slideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

type View = 'main' | 'report' | 'faq';

const faqItems = [
    { q: 'How do I pay my rent?', a: 'Tap the Payments button on the home screen. Select your rent payment and follow the instructions to complete the payment.' },
    { q: 'How do I report a broken item?', a: 'Use the Maintenance button on the home screen. Select the category of the issue, describe it, and add photos if possible.' },
    { q: 'Can I see my payment history?', a: 'Yes! Go to Payments, then tap the Receipts tab to see all your past transactions.' },
    { q: 'How do I change my property?', a: 'Go to My Property and tap "Disconnect Property" at the bottom. Then scan a new QR code to connect to a different property.' },
    { q: 'Who manages my property?', a: 'Your property manager\'s company name is shown on the My Property page under the property name.' },
    { q: 'What is Cashpower?', a: 'Cashpower is NAWEC\'s pre-paid electricity system. You can buy units through the Payments section of the app.' },
];

const reportTopics = [
    { id: 'billing_issue', label: 'Billing Issue', desc: 'Wrong charge, missing payment, refund', icon: FileText, color: '#E4F4F9' },
    { id: 'app_bug', label: 'App Problem', desc: 'Something isn\'t working right', icon: AlertCircle, color: '#FFE8E0' },
    { id: 'safety_concern', label: 'Safety Concern', desc: 'Unsafe conditions at property', icon: Shield, color: '#FFF6D4' },
    { id: 'dispute', label: 'Dispute', desc: 'Disagreement with manager or charge', icon: MessageSquare, color: '#F3E8FF' },
    { id: 'general', label: 'General Inquiry', desc: 'Question or feedback', icon: HelpCircle, color: '#E6F5DF' },
];

export default function SupportPage() {
    const router = useRouter();
    const [view, setView] = useState<View>('main');
    const [token, setToken] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    // Report form
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [reportMessage, setReportMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('samakerr_token');
        if (!saved) { router.replace('/'); return; }
        setToken(saved);

        (async () => {
            try {
                const propSnap = await getDoc(doc(db, 'properties', saved));
                if (propSnap.exists()) {
                    const propData = propSnap.data();
                    if (propData.companyId) {
                        setCompanyId(propData.companyId);
                        const compSnap = await getDoc(doc(db, 'companies', propData.companyId));
                        if (compSnap.exists()) setCompanyName(compSnap.data().companyName || 'Property Manager');
                    }
                }
            } catch { /* ignore */ }
        })();
    }, [router]);

    const handleSubmitReport = async () => {
        if (!token || !companyId || !selectedTopic || !reportMessage.trim()) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'support'), {
                companyId,
                propertyId: token,
                topic: selectedTopic,
                message: reportMessage.trim(),
                status: 'open',
                createdAt: Date.now(),
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Failed to submit report:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const resetReport = () => {
        setSelectedTopic(null);
        setReportMessage('');
        setSubmitted(false);
        setView('main');
    };

    // Success screen
    if (submitted) {
        return (
            <main className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-inter px-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-[#34C759]/15 flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-[#34C759]" />
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-[28px] font-bold text-[#1b1b1b] mb-3 tracking-tight">Report Sent</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-[15px] text-[#8a8886] mb-8 leading-relaxed">
                    Your {reportTopics.find(t => t.id === selectedTopic)?.label?.toLowerCase() || 'report'} has been submitted. {companyName} will review it shortly.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-3 w-full">
                    <button onClick={resetReport} className="flex-1 py-4 rounded-[18px] border border-[#E5E5E5] text-[14px] font-bold text-[#1b1b1b] active:bg-[#f8f8f8]">
                        New Report
                    </button>
                    <button onClick={() => router.back()} className="flex-1 py-4 rounded-[18px] bg-[#1b1b1b] text-white text-[14px] font-bold active:scale-[0.98]">
                        Done
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-white flex flex-col font-inter pb-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="px-5 pt-[calc(env(safe-area-inset-top,40px)+16px)] pb-3 flex items-center gap-3 z-10">
                <button onClick={() => view === 'main' ? router.back() : setView('main')}
                    className="w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center active:bg-[#e4e4e4] transition-colors">
                    <ChevronLeft size={24} strokeWidth={2} className="text-[#1b1b1b]" />
                </button>
                <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">
                    {view === 'report' ? 'Submit Report' : view === 'faq' ? 'Help Center' : 'Support'}
                </h1>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* MAIN VIEW */}
                {view === 'main' && (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 px-6 space-y-5">

                        {/* Quick Actions */}
                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                            <motion.button variants={slideUp} onClick={() => setView('report')}
                                className="w-full bg-[#E4F4F9] rounded-[28px] p-6 flex items-center gap-4 active:scale-[0.98] transition-transform text-left">
                                <div className="w-14 h-14 rounded-[20px] bg-white/70 flex items-center justify-center shrink-0">
                                    <FileText size={26} className="text-[#1b1b1b]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[17px] font-bold text-[#1b1b1b]">Submit a Report</p>
                                    <p className="text-[13px] text-[#1b1b1b]/60 font-medium mt-0.5">Billing issues, disputes, safety concerns</p>
                                </div>
                                <ChevronRight size={20} className="text-[#1b1b1b]/30" />
                            </motion.button>

                            <motion.button variants={slideUp} onClick={() => setView('faq')}
                                className="w-full bg-[#FFF6D4] rounded-[28px] p-6 flex items-center gap-4 active:scale-[0.98] transition-transform text-left">
                                <div className="w-14 h-14 rounded-[20px] bg-white/70 flex items-center justify-center shrink-0">
                                    <BookOpen size={26} className="text-[#1b1b1b]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[17px] font-bold text-[#1b1b1b]">Help Center</p>
                                    <p className="text-[13px] text-[#1b1b1b]/60 font-medium mt-0.5">FAQs, guides, how-to answers</p>
                                </div>
                                <ChevronRight size={20} className="text-[#1b1b1b]/30" />
                            </motion.button>
                        </motion.div>

                        {/* Contact Manager */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Contact {companyName || 'Manager'}</h3>
                            <div className="bg-white border border-[#E5E5E5] rounded-[24px] overflow-hidden shadow-sm">
                                <button className="w-full flex items-center gap-4 p-4 active:bg-[#fafafa] transition-colors border-b border-[#f3f2f1]">
                                    <div className="w-11 h-11 rounded-[14px] bg-[#E6F5DF] flex items-center justify-center shrink-0">
                                        <Phone size={20} className="text-[#1b1b1b]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[15px] font-semibold text-[#1b1b1b]">Call Manager</p>
                                        <p className="text-[12px] text-[#8a8886] font-medium">Speak directly with property management</p>
                                    </div>
                                    <ExternalLink size={16} className="text-[#c8c6c4]" />
                                </button>
                                <button className="w-full flex items-center gap-4 p-4 active:bg-[#fafafa] transition-colors">
                                    <div className="w-11 h-11 rounded-[14px] bg-[#F3E8FF] flex items-center justify-center shrink-0">
                                        <Mail size={20} className="text-[#1b1b1b]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[15px] font-semibold text-[#1b1b1b]">Send Email</p>
                                        <p className="text-[12px] text-[#8a8886] font-medium">Write a detailed message</p>
                                    </div>
                                    <ExternalLink size={16} className="text-[#c8c6c4]" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Emergency */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-[#FFF0F0] rounded-[24px] p-5 flex items-start gap-4">
                            <div className="w-11 h-11 rounded-[14px] bg-[#FF3B30]/15 flex items-center justify-center shrink-0 mt-0.5">
                                <Phone size={20} className="text-[#FF3B30]" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[#1b1b1b]">Emergency?</p>
                                <p className="text-[13px] text-[#1b1b1b]/60 font-medium mt-0.5 leading-relaxed">
                                    For fire, flood, gas leaks or other emergencies, call your local emergency services immediately.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* REPORT VIEW */}
                {view === 'report' && (
                    <motion.div key="report" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex-1 px-6 space-y-6">

                        {!selectedTopic ? (
                            <>
                                <div className="px-1">
                                    <h2 className="text-[24px] font-bold text-[#1b1b1b] tracking-tight">What do you need help with?</h2>
                                    <p className="text-[14px] text-[#8a8886] mt-1 font-medium">Select a topic for your report.</p>
                                </div>
                                <div className="space-y-3">
                                    {reportTopics.map((topic) => {
                                        const Icon = topic.icon;
                                        return (
                                            <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}
                                                className="w-full rounded-[24px] p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
                                                style={{ backgroundColor: topic.color }}>
                                                <div className="w-12 h-12 rounded-[16px] bg-white/60 flex items-center justify-center shrink-0">
                                                    <Icon size={22} className="text-[#1b1b1b]" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[16px] font-bold text-[#1b1b1b]">{topic.label}</p>
                                                    <p className="text-[12px] text-[#1b1b1b]/50 font-medium mt-0.5">{topic.desc}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-[#1b1b1b]/30" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Selected topic badge */}
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#1b1b1b]"
                                        style={{ backgroundColor: reportTopics.find(t => t.id === selectedTopic)?.color }}>
                                        {reportTopics.find(t => t.id === selectedTopic)?.label}
                                    </span>
                                    <button onClick={() => setSelectedTopic(null)} className="text-[12px] text-[#8a8886] underline font-medium">
                                        Change
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight mb-2">Describe the issue</h3>
                                    <textarea
                                        value={reportMessage}
                                        onChange={(e) => setReportMessage(e.target.value)}
                                        placeholder="Tell us what happened, when it happened, and any relevant details..."
                                        rows={6}
                                        className="w-full bg-[#f8f8f8] border border-[#E5E5E5] rounded-[20px] p-4 text-[14px] text-[#1b1b1b] placeholder-[#b1afad] outline-none resize-none focus:border-[#1b1b1b] transition-colors font-medium leading-relaxed"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitReport}
                                    disabled={submitting || !reportMessage.trim()}
                                    className="w-full bg-[#1b1b1b] text-white py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-30"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Send size={18} /> Submit Report</>
                                    )}
                                </button>
                            </>
                        )}
                    </motion.div>
                )}

                {/* FAQ VIEW */}
                {view === 'faq' && (
                    <motion.div key="faq" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex-1 px-6 space-y-3">
                        <div className="px-1 mb-2">
                            <h2 className="text-[24px] font-bold text-[#1b1b1b] tracking-tight">Frequently Asked Questions</h2>
                        </div>
                        {faqItems.map((faq, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    className="w-full bg-white border border-[#E5E5E5] rounded-[22px] p-4 text-left active:bg-[#fafafa] transition-colors shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-semibold text-[#1b1b1b] pr-4">{faq.q}</p>
                                        <ChevronRight size={18} className={`text-[#c8c6c4] shrink-0 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                                    </div>
                                    <AnimatePresence>
                                        {expandedFaq === i && (
                                            <motion.p
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-[13px] text-[#8a8886] font-medium leading-relaxed mt-3 overflow-hidden"
                                            >
                                                {faq.a}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
