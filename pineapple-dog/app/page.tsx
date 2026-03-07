"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Wallet, Activity, ShieldCheck, Map, Users, Anchor, CheckCircle } from "lucide-react";
import Link from "next/link";
import { AuthModal } from "../components/auth/AuthModal";

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function NavBar({ isScrolled, onOpenAuth }: { isScrolled: boolean; onOpenAuth: () => void }) {
  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="font-[family-name:var(--font-heading)] text-lg sm:text-2xl font-bold tracking-tight leading-tight flex-shrink-0">
          PINEAPPLEDOG<br className="block sm:hidden" />
          <span className="text-[#6366F1]">LEDGER</span>
        </Link>

        {/* Quick Links */}
        <div className="hidden lg:flex gap-10 text-sm font-medium text-white/60">
          <a href="#how-it-works" className="hover:text-white transition-colors duration-300">How it Works</a>
          <a href="#vault" className="hover:text-white transition-colors duration-300">The Vault</a>
          <a href="#impact" className="hover:text-white transition-colors duration-300">Live Claims</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={onOpenAuth} 
            className="text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
          >
            Log In
          </button>
          <button 
            onClick={onOpenAuth} 
            className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 sm:px-8 py-2 md:py-2.5 rounded-full font-[family-name:var(--font-heading)] font-semibold text-xs sm:text-sm transition-all duration-300 hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 min-h-[85vh] flex flex-col justify-center items-center text-center pt-32 pb-12 md:pb-16">
      <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8">
        Bet on yourself.<br />
        <span className="text-[#10B981]">Back the world.</span>
      </h1>
      
      <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-16 leading-relaxed">
        Lock in your goals. If you win, you keep your stake. If you fail, your money automatically funds global disaster relief.
      </p>

      <button onClick={onOpenAuth} className="flex items-center gap-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-10 py-5 rounded-full font-[family-name:var(--font-heading)] font-semibold text-lg transition-all hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] hover:-translate-y-1">
        Get Started
        <ArrowRight className="w-5 h-5" />
      </button>
    </section>
  );
}


function TrustTicker() {
  return (
    <section className="w-full border-y border-white/5 bg-[#1E293B]/30 backdrop-blur-3xl py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-around items-center gap-10 md:gap-8">
        
        <div className="flex flex-col items-center text-center">
          <div className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Total Value Locked</div>
          <div className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[#10B981] drop-shadow-[0_0_24px_rgba(16,185,129,0.3)]">S$1.2M</div>
        </div>

        <div className="hidden md:block w-px h-16 bg-white/10"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Current Vault Yield</div>
          <div className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[#10B981] drop-shadow-[0_0_24px_rgba(16,185,129,0.3)]">4.8% APY</div>
        </div>

        <div className="hidden md:block w-px h-16 bg-white/10"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-3">Disaster Claims Paid</div>
          <div className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[#10B981] drop-shadow-[0_0_24px_rgba(16,185,129,0.3)]">S$450k</div>
        </div>

      </div>
    </section>
  );
}


function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">The System</h2>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          A seamless loop between personal ambition and global impact. Transparency guaranteed by the blockchain.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Card 1 */}
        <div className="bg-[#1E293B] border border-white/5 rounded-[32px] p-8 md:p-12 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col group">
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-8 mb-10 flex items-center justify-center relative overflow-hidden flex-grow min-h-[220px]">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <Users className="w-20 h-20 text-[#6366F1] relative z-10 transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#6366F1] tracking-widest uppercase mb-4">Step 1</div>
            <h3 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white mb-4">Lock It In</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              Define your goal, choose your stakes, and tag friends or validators to keep you accountable.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1E293B] border border-white/5 rounded-[32px] p-8 md:p-12 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col group">
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-8 mb-10 flex items-center justify-center relative overflow-hidden flex-grow min-h-[220px]">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.15)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <ShieldCheck className="w-20 h-20 text-[#818CF8] relative z-10 transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#818CF8] tracking-widest uppercase mb-4">Step 2</div>
            <h3 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white mb-4">The Smart Contract</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              Funds are held safely in open vaults, ensuring complete transparency and security without central middlemen.
            </p>
          </div>
        </div>

        {/* Card 3 (Full Width) */}
        <div className="bg-[#1E293B] border border-white/5 rounded-[32px] md:col-span-2 p-8 md:p-12 lg:p-16 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row gap-12 lg:gap-24 items-center group">
          <div className="lg:w-1/2 flex flex-col justify-center order-2 lg:order-1">
            <div className="text-xs font-bold text-[#10B981] tracking-widest uppercase mb-4">Step 3</div>
            <h3 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">The Safety Net</h3>
            <p className="text-white/60 text-lg md:text-xl leading-relaxed">
              If you miss your goal, or from the natural yield of the collective vault, funds are automatically routed to verified global disaster zones. <br className="hidden lg:block mb-4"/>Your ambition literally fuels real-world relief.
            </p>
          </div>
          
          <div className="lg:w-1/2 w-full bg-[#0F172A] border border-white/5 rounded-3xl h-[300px] lg:h-[400px] relative overflow-hidden flex items-center justify-center order-1 lg:order-2">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_60%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
             <Map className="w-32 h-32 md:w-48 md:h-48 text-[#10B981] opacity-20 relative z-10" />
             
             {/* Map Nodes representing verified impact zones */}
             <div className="absolute w-6 h-6 bg-[#10B981] rounded-full top-[35%] left-[30%] shadow-[0_0_32px_rgba(16,185,129,0.8)] z-20">
                <div className="absolute inset-0 bg-[#10B981] rounded-full animate-ping opacity-75"></div>
             </div>
             
             <div className="absolute w-4 h-4 bg-[#10B981] rounded-full top-[60%] right-[30%] shadow-[0_0_24px_rgba(16,185,129,0.8)] z-20" style={{ animationDelay: '1.5s' }}>
                <div className="absolute inset-0 bg-[#10B981] rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function ImpactShowcase() {
  return (
    <section id="impact" className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 mb-8">
      <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-[#1E293B] shadow-2xl flex flex-col lg:flex-row min-h-[600px]">
        
        {/* Left Side: Text and CTA */}
        <div className="w-full lg:w-[45%] p-12 lg:p-20 flex flex-col justify-center relative z-20 bg-gradient-to-r from-[#1E293B] via-[#1E293B] to-transparent">
          <h2 className="font-[family-name:var(--font-heading)] text-5xl md:text-6xl font-bold mb-8 text-white leading-[1.1]">
            Real impact.<br/>Real time.
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-12 leading-relaxed">
            Step away from the wager. See the communities being rebuilt and the lives changed through the transparent treasury.
          </p>
          
          <Link href="/relief" className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 hover:shadow-[0_0_32px_rgba(6,182,212,0.3)] px-10 py-5 rounded-full font-[family-name:var(--font-heading)] font-semibold text-lg transition-all self-start hover:-translate-y-1">
            <Anchor className="w-6 h-6" />
            Claim Relief Funds
          </Link>
        </div>

        {/* Right Side: The Grid Map & Radar */}
        <div className="w-full lg:w-[55%] relative flex items-center justify-center p-8 lg:p-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0F172A] overflow-hidden">
          {/* Abstract ambient background */}
          <div className="absolute inset-0 z-0 opacity-80">
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.2)_0%,_transparent_60%)]"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.15)_0%,_transparent_60%)]"></div>
            
            {/* Elegant Tech Grid Pattern */}
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', 
              backgroundSize: '48px 48px',
              backgroundPosition: 'center center' 
            }}></div>
          </div>

          {/* Radar Dashboard Card */}
          <div className="relative z-10 bg-[#1E293B]/80 backdrop-blur-3xl border border-[#06B6D4]/30 rounded-[32px] p-8 md:p-10 w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.6)] transform translate-y-0 lg:-translate-x-12">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#06B6D4]/20">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-[#06B6D4] rounded-full shadow-[0_0_16px_#06B6D4] relative">
                  <div className="absolute inset-0 bg-[#06B6D4] rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-[family-name:var(--font-heading)] font-semibold text-[#06B6D4] text-xl">Active Relief Zones</span>
              </div>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full">Live Radar</span>
            </div>
            
            <div className="space-y-5 text-left">
               <div className="bg-[#0F172A]/80 border border-white/5 p-6 rounded-2xl flex flex-col gap-3 transition-colors duration-300 hover:border-[#06B6D4]/40 hover:bg-[#0F172A]">
                 <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-base">Southeast Asian Floods</span>
                    <span className="text-white/40 text-xs font-medium">12 mins ago</span>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                   <div className="w-full bg-[#1E293B] rounded-full h-2 mr-6 overflow-hidden">
                     <div className="bg-[#06B6D4] h-full rounded-full relative" style={{ width: '75%' }}>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 animate-pulse"></div>
                     </div>
                   </div>
                   <span className="text-[#06B6D4] font-[family-name:var(--font-heading)] font-bold text-lg">S$124,500</span>
                 </div>
               </div>
               
               <div className="bg-[#0F172A]/80 border border-white/5 p-6 rounded-2xl flex flex-col gap-3 transition-colors duration-300 hover:border-[#06B6D4]/40 hover:bg-[#0F172A]">
                 <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-base">Pacific Wildfire Recovery</span>
                    <span className="text-white/40 text-xs font-medium">1 hr ago</span>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                   <div className="w-full bg-[#1E293B] rounded-full h-2 mr-6 overflow-hidden">
                     <div className="bg-[#06B6D4] h-full rounded-full relative" style={{ width: '40%' }}>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 animate-pulse"></div>
                     </div>
                   </div>
                   <span className="text-[#06B6D4] font-[family-name:var(--font-heading)] font-bold text-lg">S$82,100</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function Footer() {
  return (
    <footer className="w-full py-12 md:py-16 border-t border-white/5 bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Link href="/" className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-white/40 hover:text-white transition-colors duration-300">
            PINEAPPLEDOG<span className="text-white/20">LEDGER</span>
          </Link>
          <div className="mt-4 text-sm text-white/40 font-medium">
            © 2026 PineappleDogLedger Protocol.<br className="md:hidden"/> All rights reserved.
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm md:text-base font-medium text-white/50">
          <a href="#" className="hover:text-white hover:text-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-300">Smart Contract Docs</a>
          <a href="#" className="hover:text-white hover:text-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-300">Terms of Service</a>
          <a href="#" className="hover:text-white hover:text-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-300">Community Jury</a>
        </div>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="flex flex-col min-h-screen relative w-full overflow-hidden">
      <NavBar isScrolled={isScrolled} onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Hero ambient glow background layer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-4xl h-[70vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.2)_0%,_transparent_70%)] pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        <HeroSection onOpenAuth={() => setIsAuthModalOpen(true)} />
        <TrustTicker />
        <HowItWorks />
        <ImpactShowcase />
      </div>

      <Footer />
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
