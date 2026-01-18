'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
    PlusIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navigation = [
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Tasks', href: '/todos', icon: CheckCircleIcon },
    { name: 'Add', href: '#', icon: PlusIcon, isFab: true },
    { name: 'Focus', href: '/focus', icon: ClockIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface MobileNavigationProps {
    onAddClick: () => void;
}

export default function MobileNavigation({ onAddClick }: MobileNavigationProps) {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState(pathname);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe-bottom">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 shadow-lg-up" />

            <div className="relative flex justify-around items-center h-16 px-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const isFab = item.isFab;

                    if (isFab) {
                        return (
                            <div key={item.name} className="relative -top-6">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onAddClick}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/40 text-white"
                                >
                                    <PlusIcon className="w-8 h-8" />
                                </motion.button>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex-1"
                            onClick={() => setActiveTab(item.href)}
                        >
                            <div className="flex flex-col items-center justify-center h-full p-2 group">
                                <div className="relative p-1.5 rounded-xl transition-all duration-300">
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavActive"
                                            className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-xl"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <item.icon
                                        className={`w-6 h-6 z-10 relative transition-colors duration-300 ${isActive
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                                            }`}
                                    />
                                </div>
                                <span
                                    className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${isActive
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
