"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Train, Plane, CarTaxiFront, 
  Calendar, ArrowRightLeft, Search, Facebook, Twitter, 
  Instagram, Linkedin, Mail, PhoneCall,
  Percent, ChevronDown, Clock,
  MapPin as MapPinIcon, ShieldCheck, Globe2, CreditCard, Headset,
  Sparkles, Zap, Timer
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const services = [
  { name: 'Flights', icon: Plane, id: 'flight', link: '/flights' },
  { name: 'Buses', icon: Bus, id: 'bus', link: '/bus' },
  { name: 'Trains', icon: Train, id: 'train', link: '/train' },
  { name: 'Cabs', icon: CarTaxiFront, id: 'taxi', link: '/taxi' },
];

const backgroundImages = [ 
  "/images/Flight.png", 
  "/images/Taxi.avif", 
  "/images/train.avif", 
  "/images/Bus.avif" 
];

const offers = [
  { title: 'Flat 15% Off on Domestic Flights', code: 'TRIPFLY15', category: 'Flights', img: "/images/offers/flightoffer.png" },
  { title: 'Save ₹500 on First Bus Booking', code: 'NEWBUS500', category: 'Buses', img: "/images/offers/Bus.avif" },
  { title: 'Free Taxi Upgrades to Sedan', code: 'PREMIUMRIDE', category: 'Cabs', img: "/images/offers/taxioffer.avif" },
];

const destinations = [
  { name: 'Munnar, Kerala', tours: '120+ options', img: "/images/destinations/munnar.jpg" },
  { name: 'Goa Beaches', tours: '85+ options', img: "/images/destinations/goa.jpg" },
  { name: 'Manali Mountains', tours: '90+ options', img: "/images/destinations/manali.avif" },
  { name: 'Jaipur, Rajasthan', tours: '150+ options', img: "/images/kyoto.png" },
];

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('flight');
  const [fromLocation, setFromLocation] = useState('Kochi');
  const [toLocation, setToLocation] = useState('Bangalore');
  const [currentBg, setCurrentBg] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        router.push('/admin');
      } else if (user?.role === 'operator') {
        router.push('/operator');
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const timer = setInterval(() => setCurrentBg((prev) => (prev + 1) % backgroundImages.length), 8000);
    return () => { clearInterval(timer); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const handleSwap = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const handleSearch = () => {
    if (activeTab === 'flight') {
      router.push('/flights');
    } else {
      const selectedService = services.find(s => s.id === activeTab);
      router.push(selectedService?.link || '/');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-emerald-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center items-center overflow-hidden">
        
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 bg-slate-900">
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={currentBg} src={backgroundImages[currentBg]}
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 0.5, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              alt="Background" className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-20">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            className="text-center mb-16 md:mb-24"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 py-2 px-5 rounded-full glass-dark text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles size={14} className="animate-pulse" /> New Standard of Travel
            </motion.span>
            <h1 className="text-6xl md:text-[7rem] lg:text-[8.5rem] leading-[0.95] font-black text-white tracking-tighter drop-shadow-2xl mb-8">
              BE BEYOND<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 animate-gradient-x">ORDINARY.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 font-medium leading-relaxed drop-shadow-md opacity-80">
              Curated experiences, seamless transitions, and the world's most elegant transport infrastructure at your fingertips.
            </p>
          </motion.div>

          {/* --- SEARCH WIDGET --- */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 25 }}
            className="w-full max-w-5xl mx-auto relative group"
          >
            {/* Tab Navigation */}
            <div className="flex justify-center md:justify-start mb-0 relative z-30">
              <div className="flex glass-dark p-1 rounded-t-[1.5rem] md:rounded-t-[2rem] border-b-0">
                {services.map((service) => {
                  const isActive = activeTab === service.id;
                  return (
                    <button 
                      key={service.id} 
                      onClick={() => setActiveTab(service.id)} 
                      className={`relative flex items-center gap-2 py-4 px-6 md:px-10 rounded-t-[1.25rem] md:rounded-t-[1.5rem] font-black text-[10px] md:text-xs tracking-[0.2em] uppercase transition-all duration-500 overflow-hidden ${
                        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-emerald-500 z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <service.icon size={16} /> {service.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Widget Body */}
            <div className="glass-panel p-2 md:p-3 rounded-[2.5rem] md:rounded-[3rem] shadow-premium relative z-20 border border-white/50 ring-1 ring-black/5">
              <div className="bg-white/80 backdrop-blur-md rounded-[2.2rem] md:rounded-[2.5rem] p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60">
                
                {/* Origins/Destinations */}
                <div className="flex-1 flex relative">
                  <div className="flex-1 p-4 md:p-6 hover:bg-slate-50 rounded-3xl transition-all cursor-text group/item">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover/item:text-emerald-500 transition-colors">Origin</span>
                    <input 
                      type="text" value={fromLocation} 
                      onChange={(e) => setFromLocation(e.target.value)} 
                      className="w-full bg-transparent border-none p-0 text-2xl md:text-4xl font-editorial font-bold text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-300" 
                    />
                    <p className="text-[10px] text-slate-500 mt-2 font-bold opacity-60">SELECT AIRPORT</p>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <button 
                      onClick={handleSwap}
                      className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-500 hover:rotate-180 group/swap"
                    >
                      <ArrowRightLeft size={20} className="group-hover/swap:scale-110" />
                    </button>
                  </div>

                  <div className="flex-1 p-4 md:p-6 lg:pl-12 hover:bg-slate-50 rounded-3xl transition-all cursor-text group/item">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover/item:text-emerald-500 transition-colors">Destination</span>
                    <input 
                      type="text" value={toLocation} 
                      onChange={(e) => setToLocation(e.target.value)} 
                      className="w-full bg-transparent border-none p-0 text-2xl md:text-4xl font-editorial font-bold text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-300" 
                    />
                    <p className="text-[10px] text-slate-500 mt-2 font-bold opacity-60">WHERE TO?</p>
                  </div>
                </div>

                {/* Date & Traveler */}
                <div className="lg:w-[40%] flex divide-x divide-slate-200/60">
                  <div className="flex-1 p-4 md:p-6 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer group/item">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover/item:text-emerald-500 transition-colors">Departure</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl md:text-4xl font-editorial font-bold text-slate-900">15</span>
                      <span className="text-base md:text-xl font-bold text-slate-800 pb-1">Mar</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold opacity-60 uppercase tracking-tighter">Wednesday, 2026</p>
                  </div>

                  <div className="flex-1 p-4 md:p-6 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer group/item">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover/item:text-emerald-500 transition-colors flex items-center justify-between">
                      {activeTab === 'flight' ? 'Travelers' : activeTab === 'taxi' ? 'Time' : 'Class'} <ChevronDown size={14} />
                    </span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl md:text-4xl font-editorial font-bold text-slate-900">
                        {activeTab === 'taxi' ? '10' : '01'}
                      </span>
                      <span className="text-base md:text-xl font-bold text-slate-800 pb-1">
                         {activeTab === 'taxi' ? 'AM' : 'Pax'}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-2 font-black uppercase tracking-widest">
                       {activeTab === 'flight' ? 'Economy' : activeTab === 'train' ? 'Sleeper' : 'Sedan'}
                    </p>
                  </div>
                </div>

                {/* Search Button */}
                <div className="p-4 md:p-6 lg:p-4 flex items-center justify-center">
                  <button 
                    onClick={handleSearch}
                    className="w-full lg:w-[140px] h-20 lg:h-24 bg-slate-950 hover:bg-emerald-500 text-white rounded-[2rem] shadow-2xl transition-all duration-500 flex flex-col items-center justify-center group/btn"
                  >
                    <Search size={24} className="mb-1 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Explore</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <div className="bg-white py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { icon: Globe2, title: "Global Fulfillment", desc: "Access thousands of premium routes with zero latency booking." },
              { icon: ShieldCheck, title: "Secured by Bank-Grade", desc: "Military-grade encryption for every elite transaction." },
              { icon: Headset, title: "24/7 Digital Concierge", desc: "Dedicated human-AI hybrid support for the modern voyager." }
            ].map((f, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="group"
              >
                <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight uppercase">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed opacity-80">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- EXCLUSIVE OFFERS --- */}
      <div className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div>
              <span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] block mb-4">Curated Deals</span>
              <h2 className="text-5xl md:text-6xl font-editorial font-bold text-slate-900 tracking-tight">The <span className="italic font-light">Tripneo</span> Collection</h2>
            </div>
            <button className="flex items-center gap-3 bg-white hover:bg-slate-950 hover:text-white text-slate-900 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-full border border-slate-200 transition-all duration-500 shadow-sm">
              View Collection <ChevronDown size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {offers.map((offer, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer group shadow-premium"
              >
                <img src={offer.img} alt={offer.title} className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[2s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent p-10 flex flex-col justify-end">
                  <span className="absolute top-10 left-10 glass-dark text-white text-[10px] font-black tracking-widest px-6 py-2 rounded-full uppercase">
                    {offer.category}
                  </span>
                  <h3 className="text-4xl font-editorial font-bold text-white mb-6 leading-tight leading-relaxed">{offer.title}</h3>
                  <div className="flex items-center justify-between border-t border-white/20 pt-6">
                    <div className="flex flex-col">
                      <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">PROMO</span>
                      <span className="text-emerald-400 font-black text-lg tracking-widest">{offer.code}</span>
                    </div>
                    <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-all duration-500">
                      <ArrowRightLeft size={18} className="rotate-45" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* --- DESTINATIONS --- */}
      <div className="bg-slate-950 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-20 flex justify-between items-center">
           <div>
              <span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] block mb-4">Inspiration</span>
              <h2 className="text-5xl md:text-6xl font-editorial font-bold text-white tracking-tight leading-tight">Beyond <span className="italic font-light text-emerald-400">Borders.</span></h2>
           </div>
        </div>

        <div className="flex flex-nowrap overflow-x-auto gap-8 px-6 lg:px-8 pb-10 scrollbar-hide cursor-grab active:cursor-grabbing">
          {[...destinations, ...destinations].map((dest, i) => (
            <motion.div 
              key={i} 
              className="relative w-[320px] md:w-[450px] h-[550px] shrink-0 rounded-[4rem] overflow-hidden group shadow-2xl"
            >
              <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-all duration-[3s] group-hover:scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-12 flex flex-col justify-end">
                <h3 className="text-4xl font-editorial font-bold text-white mb-2">{dest.name.split(',')[0]}</h3>
                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em]">{dest.name.split(',')[1]?.trim() || 'Experience'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
            <div className="space-y-10">
              <span className="text-4xl font-black text-slate-950 tracking-tighter uppercase">TRIP<span className="text-emerald-500">neo.</span></span>
              <p className="text-2xl font-editorial text-slate-500 leading-relaxed max-w-lg italic">
                Crafting seamless transitions for the modern voyager, where every destination is just a touch away.
              </p>
              <div className="flex gap-6">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-500"><Icon size={18} /></a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div className="space-y-8">
                <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Voyage</h4>
                <ul className="space-y-4">
                  {['Private Jets', 'Executive Bus', 'Express Rail'].map(it => <li key={it}><a href="#" className="text-slate-900 font-bold text-sm hover:text-emerald-500 transition-colors">{it}</a></li>)}
                </ul>
              </div>
              <div className="space-y-8">
                <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Concierge</h4>
                <ul className="space-y-4">
                  {['Priority Plus', 'Travel Safely', 'Support'].map(it => <li key={it}><a href="#" className="text-slate-900 font-bold text-sm hover:text-emerald-500 transition-colors">{it}</a></li>)}
                </ul>
              </div>
              <div className="hidden md:block space-y-8">
                <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Corporate</h4>
                <ul className="space-y-4">
                  {['Partners', 'Press', 'Careers'].map(it => <li key={it}><a href="#" className="text-slate-900 font-bold text-sm hover:text-emerald-500 transition-colors">{it}</a></li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} TRIPNEO TRAVEL. REDEFINING MOVEMENT.</p>
            <div className="flex items-center gap-4 text-slate-400">
               <span className="text-[10px] font-black tracking-widest uppercase">Secured by Stripe</span>
               <ShieldCheck size={20} className="text-emerald-500" />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}