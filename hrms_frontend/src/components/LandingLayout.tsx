"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

import {
    Mail,
    Phone,
    MessageCircle,
    MessageSquare,
    Calendar,
    Clock,
    Zap,
    Target,
    Timer,
    UserCheck,
    Camera,
    TrafficCone,
    Trophy,
    Check,
    X,
    Star,
    PlayCircle,
    BarChart3,
    ShieldCheck,
    Send,
    ChevronRight,
    Sparkles,
    Eye,
    Circle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AnimatedTextProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

interface FillOnScrollTextProps {
    children: ReactNode;
    className?: string;
}

interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

interface StaggerItemProps {
    children: ReactNode;
    className?: string;
}

interface FloatingCardProps {
    children: ReactNode;
    className?: string;
}

interface FeatureItem {
    icon: ReactNode;
    title: string;
    description: string;
}

interface BenefitItem {
    title: string;
    description: string;
    stat: string;
}

interface PricingPlan {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    notIncluded?: string[];
    cta: string;
    popular: boolean;
    buttonColor: string;
}

interface NavigationItem {
    id: string;
    label: string;
}

interface FooterSection {
    title: string;
    links: Array<{
        label: string;
        href: string;
    }>;
}

interface StatItem {
    value: ReactNode;
    label: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
                                                       children,
                                                       className = "",
                                                       delay = 0
                                                   }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-20px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
                duration: 0.6,
                delay: delay,
                ease: [0.21, 1.11, 0.81, 0.99]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const FillOnScrollText: React.FC<FillOnScrollTextProps> = ({
                                                               children,
                                                               className = ""
                                                           }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.9", "end 0.1"]
    });

    return (
        <motion.div
            ref={ref}
            style={{
                opacity: useTransform(scrollYProgress, [0, 0.3, 1], [0.4, 0.8, 1]),
                scale: useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1, 1])
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const StaggerContainer: React.FC<StaggerContainerProps> = ({
                                                               children,
                                                               className = "",
                                                               delay = 0
                                                           }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const StaggerItem: React.FC<StaggerItemProps> = ({
                                                     children,
                                                     className = ""
                                                 }) => {
    return (
        <motion.div
            variants={{
                hidden: {
                    opacity: 0,
                    y: 15,
                    scale: 0.98
                },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        duration: 0.5,
                        ease: "easeOut"
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const FloatingCard: React.FC<FloatingCardProps> = ({
                                                       children,
                                                       className = ""
                                                   }) => {
    return (
        <motion.div
            whileHover={{
                y: -4,
                scale: 1.01,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.99 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const GradientButton: React.FC<{
    children: ReactNode;
    className?: string;
    size?: "default" | "lg";
    onClick?: () => void;
}> = ({ children, className = "", size = "default", onClick }) => {
    const gradientProgress = useMotionValue(0);
    const springProgress = useSpring(gradientProgress, {
        stiffness: 80,
        damping: 20,
        duration: 0.6
    });

    const backgroundGradient = useTransform(
        springProgress,
        [0, 1],
        [
            'linear-gradient(90deg, #10b981 0%, #064e3b 100%)',
            'linear-gradient(90deg, #064e3b 0%, #10b981 100%)'
        ]
    );

    const baseClasses = "text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300";
    const sizeClasses = size === "lg"
        ? "px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg"
        : "px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-xs sm:text-sm";

    return (
        <motion.button
            className={`${baseClasses} ${sizeClasses} ${className}`}
            style={{
                background: backgroundGradient
            }}
            onHoverStart={() => gradientProgress.set(1)}
            onHoverEnd={() => gradientProgress.set(0)}
            onClick={onClick}
        >
            {children}
        </motion.button>
    );
};

const LandingPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>("features");
    const [token, setToken] = useState<string | null>(null);
    const [decodedToken, setDecodedToken] = useState<any>(null);
    const router = useRouter();

    const navigationItems: NavigationItem[] = [
        { id: "features", label: "Features" },
        { id: "pricing", label: "Pricing" },
        { id: "demo", label: "Demo" },
        { id: "benefits", label: "Benefits" },
        { id: "contact", label: "Contact" },
    ];

    const features: FeatureItem[] = [
        {
            icon: <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "Task-Based Login/Logout",
            description: "Start and end your day with clear task objectives. No vague clock-ins, just purposeful productivity tracking."
        },
        {
            icon: <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "TAT & Smart Reminders",
            description: "Turnaround time alerts keep projects on schedule with intelligent notifications and deadline management."
        },
        {
            icon: <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "Approval Workflow System",
            description: "Manager-based task approvals ensure quality control and maintain accountability standards."
        },
        {
            icon: <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "Proof of Work Upload",
            description: "Visual evidence for every completed task builds trust and provides clear progress documentation."
        },
        {
            icon: <TrafficCone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "Real-Time Signal Lights",
            description: "Instant Red/Yellow/Green status indicators show team performance at a glance."
        },
        {
            icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
            title: "Performance Leaderboards",
            description: "Gamified scorecards motivate teams and recognize top performers with transparent rankings."
        }
    ];

    const benefits: BenefitItem[] = [
        {
            title: "80+ Lakhs Registered SMEs",
            description: "Join millions of businesses already using performance-based management systems to drive results.",
            stat: "80L+"
        },
        {
            title: "650+ Districts Coverage",
            description: "Nationwide presence ensuring local support and understanding of diverse business needs.",
            stat: "650+"
        },
        {
            title: "3x Faster Task Completion",
            description: "Teams using task-based tracking complete projects faster with clear accountability measures.",
            stat: "3x"
        },
        {
            title: "24/7 Expert Support",
            description: "Monday to Sunday, 8am - 8pm support via call and WhatsApp for immediate assistance.",
            stat: "24/7"
        }
    ];

    const pricingPlans: PricingPlan[] = [
        {
            name: "Basic",
            price: "₹900",
            period: "/year per user",
            description: "Essential task management for small teams",
            features: [
                "Task Management",
                "Manager Assignment",
                "Basic Reporting",
                "Email Support",
            ],
            notIncluded: [
                "Real-Time Signals",
                "Task Approval System",
                "Face Scan App",
                "Proof Upload",
                "Bulk Upload CSV",
                "Weekly Reports"
            ],
            cta: "Choose Basic",
            popular: false,
            buttonColor: "bg-blue-600 hover:bg-blue-700"
        },
        {
            name: "Advanced",
            price: "₹1,800",
            period: "/year per user",
            description: "Complete performance tracking solution",
            features: [
                "Everything in Basic",
                "Real-Time Signal Lights",
                "Task Approval System",
                "Face Scan Authentication",
                "Proof of Work Upload",
                "Bulk Task Upload (CSV)",
                "Automated Weekly Reports",
                "Performance Leaderboards",
                "Priority Support Access"
            ],
            cta: "Go Advanced",
            popular: true,
            buttonColor: "bg-green-500 hover:bg-green-600"
        }
    ];

    const dashboardStats: StatItem[] = [
        { value: "98%", label: "Task Completion" },
        { value: "24h", label: "Avg Response" },
        { value: "95%", label: "Approval Rate" },
        {
            value: (
                <span className="flex items-center justify-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span>4.9</span>
      </span>
            ),
            label: "User Rating"
        }
    ];

    const footerSections: FooterSection[] = [
        {
            title: "Product",
            links: [
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Demo", href: "#demo" },
                { label: "Mobile App", href: "#" }
            ]
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Careers", href: "/career" },
                { label: "Contact", href: "#contact" }
            ]
        },
        {
            title: "Support",
            links: [
                { label: "Help Center", href: "#" },
                { label: "Documentation", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" }
            ]
        }
    ];

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            try {
                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                setDecodedToken(payload);
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, []);

    const handleDashboardClick = () => {
        if (!decodedToken) return;

        const { role, isSuperUser, isOrganizer, orgPermissions } = decodedToken;
        let path: string;

        if (isSuperUser || role === 'SUPER_ADMIN') {
            path = '/dashboard/super_admin';
        } else if (isOrganizer || role === 'ADMIN') {
            path = '/dashboard/admin';
        } else {
            path = '/dashboard/dynamic';
        }

        router.push(path);
    };

    useEffect(() => {
        const handleScroll = (): void => {
            const sections = ["features", "pricing", "demo", "benefits", "contact"];
            const scrollPosition = window.scrollY + 200;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (sectionId: string): void => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-100 z-50 shadow-sm"
            >
                <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
                        <motion.div
                            className="flex items-center gap-1.5 sm:gap-2"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Image
                                src="/favicon_io/apple-touch-icon.png"
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mix-blend-multiply contrast-125 brightness-110"
                                alt="MintHR Logo"
                                priority
                                width={32}
                                height={32}
                            />
                            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">MintHR</span>
                        </motion.div>

                        <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                            {navigationItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-3 xl:px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm ${
                                        activeSection === item.id
                                            ? "bg-emerald-50 text-emerald-600 shadow-sm"
                                            : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                                    }`}
                                    onClick={() => scrollToSection(item.id)}
                                    type="button"
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                            {token ? (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <GradientButton onClick={handleDashboardClick}>
                                        Dashboard
                                    </GradientButton>
                                </motion.div>
                            ) : (
                                <Link href="/auth/Login">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <GradientButton>
                                            Login
                                        </GradientButton>
                                    </motion.div>
                                </Link>
                            )}
                        </div>

                        <div className="lg:hidden">
                            {token ? (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <GradientButton size="default" onClick={handleDashboardClick}>
                                        Dashboard
                                    </GradientButton>
                                </motion.div>
                            ) : (
                                <Link href="/auth/Login">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <GradientButton size="default">
                                            Login
                                        </GradientButton>
                                    </motion.div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.nav>

            <section className="relative pt-24 lg:pt-32 pb-32 lg:pb-48 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 rounded-[2rem] sm:rounded-[3rem] px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-28 shadow-2xl shadow-emerald-900/20">
                    {/* Background SVG shapes & glowing effects */}
                    <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] overflow-hidden pointer-events-none">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                        >
                            <source src="/hero.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-400/10 blur-[100px]" />
                        <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[70%] rounded-full bg-slate-500/20 blur-[120px]" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center lg:items-start lg:pb-16">
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                                    Elevate Your<br className="hidden lg:block" />
                                    Team&apos;s Output.<br className="hidden lg:block" />
                                    Effortlessly.
                                </h1>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-5 space-y-8 text-center lg:text-left pt-2 lg:pt-16">
                            <motion.p
                                className="text-base sm:text-lg lg:text-xl text-emerald-50 leading-relaxed font-medium max-w-md mx-auto lg:mx-0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            >
                                MintHR aligns your workforce with smart task tracking, automated approvals, and real-time insights—empowering teams to scale faster, together.
                            </motion.p>
                            
                            <motion.div 
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            >
                                <button className="px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base border border-emerald-400">
                                    Get Started
                                </button>
                                <button className="px-6 py-3 rounded-full bg-white text-emerald-950 font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base">
                                    Book a Demo
                                </button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Overlapping Bottom Cards */}
                    <div className="absolute -bottom-24 left-0 right-0 w-full px-6 sm:px-12 lg:px-16 z-20 hidden md:block">
                        <div className="grid grid-cols-3 gap-6 lg:gap-8 w-full max-w-[1200px] mx-auto">
                            {/* Card 1 */}
                            <motion.div 
                                className="bg-white rounded-3xl p-6 shadow-[0_16px_40px_rgb(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between h-[180px] hover:-translate-y-2 transition-transform duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                         <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">SJ</div>
                                         <div>
                                             <p className="font-bold text-gray-900 text-base">Sarah Jenkins</p>
                                             <p className="text-xs font-medium text-gray-500">Lead Developer</p>
                                         </div>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold whitespace-nowrap">Top Performer</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Zap className="w-3.5 h-3.5 text-yellow-500"/> React</span>
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Target className="w-3.5 h-3.5 text-blue-500"/> Node.js</span>
                                </div>
                            </motion.div>
                            
                            {/* Card 2 */}
                            <motion.div 
                                className="bg-white rounded-3xl p-6 shadow-[0_16px_40px_rgb(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between h-[180px] hover:-translate-y-2 transition-transform duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                         <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">DC</div>
                                         <div>
                                             <p className="font-bold text-gray-900 text-base">David Chen</p>
                                             <p className="text-xs font-medium text-gray-500">Product Manager</p>
                                         </div>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold whitespace-nowrap">On Track</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Target className="w-3.5 h-3.5 text-emerald-500"/> Strategy</span>
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Zap className="w-3.5 h-3.5 text-orange-500"/> Agile</span>
                                </div>
                            </motion.div>
                            
                            {/* Card 3 */}
                            <motion.div 
                                className="bg-white rounded-3xl p-6 shadow-[0_16px_40px_rgb(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between h-[180px] hover:-translate-y-2 transition-transform duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                         <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">ER</div>
                                         <div>
                                             <p className="font-bold text-gray-900 text-base">Elena Rios</p>
                                             <p className="text-xs font-medium text-gray-500">UI/UX Designer</p>
                                         </div>
                                    </div>
                                    <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold whitespace-nowrap">Creative Lead</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"/> Figma</span>
                                     <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100"><Star className="w-3.5 h-3.5 text-pink-500"/> Framer</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <AnimatedText className="text-center mb-8 sm:mb-12 lg:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                            Why Choose MintHR?
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
                            Built specifically for modern hybrid teams who demand accountability and results.
                        </p>
                    </AnimatedText>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" delay={0.2}>
                        {[
                            {
                                icon: <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />,
                                title: "Time-Smart Teams",
                                description: "Intelligent time tracking with automatic task-based check-ins and real-time productivity insights."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />,
                                title: "Proof-Backed Accountability",
                                description: "Every task completion requires proof upload and manager approval for complete transparency."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />,
                                title: "Track. Approve. Improve.",
                                description: "Visual signal lights (Red/Yellow/Green) show real-time status with actionable improvement suggestions."
                            }
                        ].map((item, index) => (
                            <StaggerItem key={index} className="md:col-span-1 xl:col-span-1">
                                <FloatingCard>
                                    <Card className="h-full bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg sm:rounded-xl md:rounded-2xl">
                                        <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                                            <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                                                {item.icon}
                                            </div>
                                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">{item.title}</h3>
                                            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">{item.description}</p>
                                        </CardContent>
                                    </Card>
                                </FloatingCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            <section id="features" className="min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto w-full">
                    <FillOnScrollText className="text-center mb-6 sm:mb-8 lg:mb-12">
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                            Powerful Features for <span className="text-emerald-600">Peak Performance</span>
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
                            Everything your team needs to stay accountable, productive, and continuously improving.
                        </p>
                    </FillOnScrollText>

                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" delay={0.1}>
                        {features.map((feature, index) => (
                            <StaggerItem key={index}>
                                <FloatingCard>
                                    <Card className="h-full bg-white border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 rounded-lg sm:rounded-xl">
                                        <CardContent className="p-3 sm:p-4 md:p-5">
                                            <div className="text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3">{feature.icon}</div>
                                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
                                            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                </FloatingCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            <section id="pricing" className="min-h-screen flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-6xl mx-auto w-full">
                    <FillOnScrollText className="text-center mb-6 sm:mb-8 lg:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                            Simple Plans, <span className="text-emerald-600">Powerful Outcomes</span>
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-4">
                            Choose the perfect plan to transform your team&apos;s productivity and accountability.
                        </p>
                    </FillOnScrollText>

                    <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto" delay={0.2}>
                        {pricingPlans.map((plan, index) => (
                            <StaggerItem key={index} className="flex flex-col h-full">
                                <FloatingCard className="flex flex-col h-full">
                                    <Card className={`relative flex flex-col h-full bg-white shadow-lg hover:shadow-xl transition-all duration-500 rounded-lg sm:rounded-xl md:rounded-2xl`}
                                          style={{
                                              boxShadow: '0 4px 20px rgba(11, 94, 215, 0.08)'
                                          }}
                                    >
                                        <AnimatePresence>
                                            {plan.popular && (
                                                <motion.div
                                                    className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-10"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                                                >
                          <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-2 sm:px-3 md:px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                            Most Popular
                          </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <CardContent className="flex flex-col flex-grow p-3 sm:p-4 md:p-6">
                                            <div className="text-center mb-3 sm:mb-4 md:mb-6">
                                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{plan.name}</h3>
                                                <div className="mb-2 sm:mb-3">
                                                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{plan.price}</span>
                                                    <span className="text-gray-500 text-xs sm:text-sm md:text-base">{plan.period}</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600">{plan.description}</p>
                                            </div>

                                            <div className="flex-1 space-y-2 sm:space-y-3 mb-3 sm:mb-4 md:mb-6">
                                                {plan.features.map((feature, featureIndex) => (
                                                    <motion.div
                                                        key={featureIndex}
                                                        className="flex items-center gap-2 sm:gap-3"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 * featureIndex }}
                                                    >
                                                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Check className="w-2 h-2 text-white" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm text-gray-700 font-medium">{feature}</span>
                                                    </motion.div>
                                                ))}

                                                {plan.notIncluded?.map((feature, featureIndex) => (
                                                    <div key={`not-${featureIndex}`} className="flex items-center gap-2 sm:gap-3">
                                                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <X className="w-2 h-2 text-white" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm text-gray-500 line-through">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto">
                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <GradientButton className="w-full">
                                                        {plan.cta}
                                                    </GradientButton>
                                                </motion.div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FloatingCard>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            <section id="demo" className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
                        <motion.div
                            className="mt-6 sm:mt-8 lg:mt-0 order-2 lg:order-1"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <div className="bg-gradient-to-br from-slate-800 to-emerald-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl">
                                <motion.div
                                    className="w-full h-48 sm:h-64 md:h-72 lg:h-80 rounded-lg sm:rounded-xl overflow-hidden shadow-lg flex items-center justify-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    viewport={{ once: true }}
                                >
                                    <video
                                        className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                        controls
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        poster="/demo-thumbnail.jpg"
                                    >
                                        <source src="/demo-video.mp4" type="video/mp4" />
                                        <source src="/demo-video.webm" type="video/webm" />
                                        Your browser does not support the video tag.
                                    </video>
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left order-1 lg:order-2"
                        >
                            <FillOnScrollText>
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                                    Experience the MintHR Demo
                                </h2>
                            </FillOnScrollText>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Discover how MintHR transforms team productivity through intuitive task tracking and real-time performance insights. This demo showcases the application&apos;s seamless interface, intelligent accountability features, and powerful reporting tools – empowering your team to achieve peak performance every day.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section id="benefits" className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <FillOnScrollText>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8 text-center">
                            Transform Your Team&apos;s <span className="text-emerald-600">Performance Today</span>
                        </h2>
                    </FillOnScrollText>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="order-2 lg:order-1"
                        >
                            <StaggerContainer className="space-y-4 sm:space-y-6" delay={0.2}>
                                {benefits.map((benefit, index) => (
                                    <StaggerItem key={index}>
                                        <motion.div
                                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-emerald-50 transition-all duration-300 text-center sm:text-left"
                                            whileHover={{ x: typeof window !== 'undefined' && window.innerWidth >= 640 ? 10 : 0 }}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-slate-800 to-emerald-900 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                                                <span className="text-white font-bold text-xs sm:text-sm">{benefit.stat}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                                                <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
                                            </div>
                                        </motion.div>
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        </motion.div>

                        <motion.div
                            className="relative order-1 lg:order-2"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <div className="bg-gradient-to-br from-slate-800 to-emerald-900  rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl">
                                <div className="bg-white backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
                                    <div className="text-center">
                                        <div className="text-black font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Live Performance Dashboard</div>
                                        <div className="text-black text-xs sm:text-sm">Real-time team insights</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                        {dashboardStats.map((stat, index) => (
                                            <motion.div
                                                key={index}
                                                className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center"
                                                whileHover={{ scale: 1.05 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 * index, duration: 0.5 }}
                                                viewport={{ once: true }}
                                            >
                                                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black mb-1">{stat.value}</div>
                                                <div className="text-black text-xs">{stat.label}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="flex justify-center space-x-2 sm:space-x-3">
                                        <motion.div
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                        <motion.div
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
                                        />
                                        <motion.div
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-400"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, delay: 0.8 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section id="contact" className="min-h-screen flex items-center px-3 sm:px-4 md:px-6 lg:px-8 bg-white py-8 sm:py-12 md:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto w-full">
                    <AnimatedText className="text-center mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-[#2D2D2D] mb-2 sm:mb-3 font-sans flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#0B5ED7]" />
                            Get in Touch with Our Support Team
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base text-[#6C757D] leading-relaxed max-w-2xl mx-auto font-sans px-2">
                            Have questions about MintHR? We&apos;re here to help!
                        </p>
                    </AnimatedText>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg"
                            style={{
                                boxShadow: '0 8px 30px rgba(11, 94, 215, 0.1)'
                            }}
                        >
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#2D2D2D] mb-3 sm:mb-4 font-sans">Send us a Message</h3>

                            <form className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-[#2D2D2D] font-medium mb-1 font-sans text-xs sm:text-sm">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-white border-2 border-gray-200 text-[#2D2D2D] placeholder-[#6C757D] focus:outline-none focus:border-[#0B5ED7] transition-all duration-300 font-sans text-xs sm:text-sm"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#2D2D2D] font-medium mb-1 font-sans text-xs sm:text-sm">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-white border-2 border-gray-200 text-[#2D2D2D] placeholder-[#6C757D] focus:outline-none focus:border-[#0B5ED7] transition-all duration-300 font-sans text-xs sm:text-sm"
                                        placeholder="Enter your email address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#2D2D2D] font-medium mb-1 font-sans text-xs sm:text-sm">Query Type</label>
                                    <select className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-white border-2 border-gray-200 text-[#2D2D2D] focus:outline-none focus:border-[#0B5ED7] transition-all duration-300 font-sans text-xs sm:text-sm">
                                        <option value="">Select query type</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="billing">Billing & Pricing</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="demo">Schedule Demo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#2D2D2D] font-medium mb-1 font-sans text-xs sm:text-sm">Message *</label>
                                    <textarea
                                        rows={3}
                                        required
                                        className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-white border-2 border-gray-200 text-[#2D2D2D] placeholder-[#6C757D] focus:outline-none focus:border-[#0B5ED7] transition-all duration-300 resize-none font-sans text-xs sm:text-sm"
                                        placeholder="Tell us how we can help you..."
                                    ></textarea>
                                </div>

                                <GradientButton className="w-full py-2.5 sm:py-3 text-xs sm:text-sm lg:text-base">
                                    Send Message
                                </GradientButton>
                            </form>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg"
                            style={{
                                boxShadow: '0 8px 30px rgba(11, 94, 215, 0.1)'
                            }}
                        >
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#2D2D2D] mb-3 sm:mb-4 font-sans">Contact Information</h3>

                            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
                                <motion.div
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 transition-all duration-300"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div
                                        className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                                            boxShadow: '0 3px 10px rgba(11, 94, 215, 0.3)'
                                        }}
                                    >
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[#6C757D] font-medium mb-0.5 font-sans text-xs">Email Support</p>
                                        <a
                                            href="mailto:demo@minthr.com"
                                            className="text-[#0B5ED7] hover:text-[#094BB8] transition-colors font-semibold font-sans text-xs sm:text-sm break-all"
                                        >
                                            demo@minthr.com
                                        </a>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 transition-all duration-300"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div
                                        className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                                            boxShadow: '0 3px 10px rgba(11, 94, 215, 0.3)'
                                        }}
                                    >
                                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[#6C757D] font-medium mb-0.5 font-sans text-xs">Phone Support</p>
                                        <a
                                            href="tel:+911234567890"
                                            className="text-[#0B5ED7] hover:text-[#094BB8] transition-colors font-semibold font-sans text-xs sm:text-sm"
                                        >
                                            +91 1234567890
                                        </a>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-all duration-300"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div
                                        className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
                                            boxShadow: '0 3px 10px rgba(39, 174, 96, 0.3)'
                                        }}
                                    >
                                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[#6C757D] font-medium mb-0.5 font-sans text-xs">WhatsApp</p>
                                        <a
                                            href="https://wa.me/911234567890"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#27AE60] hover:text-[#229954] transition-colors font-semibold font-sans text-xs sm:text-sm"
                                        >
                                            +91 1234567890
                                        </a>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="pt-2 sm:pt-3 md:pt-4 border-t border-gray-200">
                                <h4 className="text-[#2D2D2D] font-bold mb-1 sm:mb-2 md:mb-3 font-sans text-xs sm:text-sm md:text-base">Support Hours</h4>
                                <div className="space-y-1 text-[#6C757D] font-sans text-xs">
                                    <p className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        <span>Monday to Sunday</span>
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span>8:00 AM - 8:00 PM (IST)</span>
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <Zap className="w-3 h-3" />
                                        <span>Response: 2-4 hours</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-200 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="sm:col-span-2 lg:col-span-1"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                                <Image
                                    src="/favicon_io/apple-touch-icon.png"
                                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mix-blend-multiply contrast-125 brightness-110"
                                    alt="MintHR"
                                    width={32}
                                    height={32}
                                />
                                <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">MintHR</span>
                            </div>
                            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                                Empowering teams to achieve peak performance through intelligent
                                task-based accountability and real-time insights.
                            </p>
                        </motion.div>

                        {footerSections.map((section, sectionIndex) => (
                            <motion.div
                                key={sectionIndex}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 * (sectionIndex + 1) }}
                                viewport={{ once: true }}
                                className="text-center sm:text-left"
                            >
                                <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base md:text-lg">{section.title}</h3>
                                <ul className="space-y-1 sm:space-y-2 md:space-y-3 text-gray-600">
                                    {section.links.map((link, linkIndex) => (
                                        <li key={linkIndex}>
                                            <a
                                                href={link.href}
                                                className="hover:text-emerald-600 transition-colors duration-200 text-xs sm:text-sm md:text-base"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="border-t border-gray-200 mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6 md:pt-8 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-gray-500 text-xs sm:text-sm md:text-base">
                            &copy; 2025 Anonx technologies. All rights reserved.
                        </p>
                    </motion.div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;