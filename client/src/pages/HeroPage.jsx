import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const HeroPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="bg-surface/70 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline/30 animate-fade-in">
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto px-md md:px-xl py-md">
          <div className="flex items-center gap-3 group cursor-default">
            <img src="/logo.png" alt="KAIROS" className="h-10 w-auto object-contain brightness-110 contrast-125" />
            <div className="font-h1 text-h1 font-light tracking-[0.2em] text-on-surface uppercase group-hover:tracking-[0.3em] transition-all duration-700">KAIROS</div>
          </div>

          <div className="hidden md:flex gap-lg items-center">
            {user ? (
              <button onClick={logout} className="font-eyebrow text-eyebrow uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all">Logout</button>
            ) : (
              <Link to="/auth" className="font-eyebrow text-eyebrow uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all">Login</Link>
            )}
          </div>
          <Link to={user ? "/dashboard" : "/auth"} className="bg-primary-container text-on-primary font-eyebrow text-eyebrow uppercase tracking-[0.1em] px-md py-sm rounded-DEFAULT flex items-center gap-sm hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all duration-300">
            {user ? 'Go to Dashboard' : 'Begin Planning'} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative min-h-screen flex items-center justify-center pt-[100px]">
        {/* Background Image with Slow Zoom */}
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
          <img
            src="/hero-bg.png"
            alt="Kairos Luxury Events"
            className="object-cover w-full h-full animate-slow-zoom"
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-container-max px-md md:px-xl mx-auto flex flex-col items-center text-center">
          <span className="font-eyebrow text-eyebrow text-primary-container uppercase mb-md md:mb-lg block opacity-0 animate-reveal-up" style={{ animationDelay: '0.2s' }}>
            PREMIUM EVENT PLANNING — PAKISTAN
          </span>
          <h1 className="font-hero-display text-hero-display-mobile md:text-hero-display text-on-surface uppercase mb-md max-w-4xl mx-auto opacity-0 animate-reveal-up" style={{ animationDelay: '0.4s' }}>
            A NEW ERA OF EVENT PLANNING
          </h1>
          <p className="font-h2 text-h2 text-on-surface-variant mb-lg md:mb-xl max-w-2xl mx-auto opacity-0 animate-reveal-up" style={{ animationDelay: '0.6s' }}>
            KAIROS matches you with the finest venues, caterers, and decorators — intelligently, instantly.
          </p>
          <div className="flex flex-col md:flex-row gap-md items-center justify-center w-full opacity-0 animate-reveal-up" style={{ animationDelay: '0.8s' }}>
            <Link to="/auth" className="bg-primary-container text-on-primary font-eyebrow text-eyebrow uppercase tracking-[0.1em] px-xl py-md rounded-DEFAULT flex items-center gap-sm hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all duration-500 w-full md:w-auto justify-center group">
              Begin Planning
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-lg max-w-4xl mx-auto border-t border-outline/30 pt-lg w-full opacity-0 animate-reveal-up" style={{ animationDelay: '1s' }}>
            <div className="flex flex-col items-center gap-xs group cursor-default">
              <span className="font-h2 text-h2 text-primary-container group-hover:scale-110 transition-transform duration-500">50+</span>
              <span className="font-eyebrow text-eyebrow text-on-surface-variant uppercase">Premium Venues</span>
            </div>
            <div className="flex flex-col items-center gap-xs border-t md:border-t-0 md:border-l border-outline/30 pt-lg md:pt-0 md:pl-lg group cursor-default">
              <span className="font-h2 text-h2 text-primary-container group-hover:scale-110 transition-transform duration-500">200+</span>
              <span className="font-eyebrow text-eyebrow text-on-surface-variant uppercase">Curated Vendors</span>
            </div>
            <div className="flex flex-col items-center gap-xs border-t md:border-t-0 md:border-l border-outline/30 pt-lg md:pt-0 md:pl-lg group cursor-default">
              <span className="font-h2 text-h2 text-primary-container group-hover:scale-110 transition-transform duration-500">Intelligent</span>
              <span className="font-eyebrow text-eyebrow text-on-surface-variant uppercase">AI-Powered Matching</span>
            </div>
          </div>

          {/* Exclusive Deals Section */}
          <section className="mt-24 w-full opacity-0 animate-reveal-up" style={{ animationDelay: '1.2s' }}>
            <div className="flex items-center gap-md mb-xl">
              <div className="h-[1px] flex-grow bg-outline/30"></div>
              <h2 className="font-eyebrow text-eyebrow text-primary uppercase tracking-[0.3em]">Exclusive Seasonal Deals</h2>
              <div className="h-[1px] flex-grow bg-outline/30"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg text-left">
              {[
                { title: "LUMIERE WEDDING SUITE", desc: "Full venue, premium catering, and bespoke decor with 20% savings.", city: "Lahore", discount: "20%" },
                { title: "CORPORATE EXCELLENCE", desc: "Sophisticated corporate planning with complimentary AV and 15% off catering.", city: "Karachi", discount: "15%" },
                { title: "SIGNATURE GALA BUNDLE", desc: "Elite gala package including priority booking and 25% discount.", city: "Islamabad", discount: "25%" },
                { title: "MEMORIAL BIRTHDAY PACKAGE", desc: "Bespoke birthday celebrations with 10% flat discount on all services.", city: "Lahore", discount: "10%" }
              ].map((deal, idx) => (
                <div key={idx} className="group bg-surface-container-low/40 backdrop-blur-md border border-outline/20 p-lg rounded-sm hover:border-primary/50 transition-all duration-500 hover:translate-y-[-4px] relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
                  <div className="flex justify-between items-start mb-md">
                    <span className="font-eyebrow text-[10px] text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-sm">{deal.city}</span>
                    <span className="font-h2 text-h2 text-primary">{deal.discount} OFF</span>
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface uppercase mb-sm tracking-wider">{deal.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70 mb-md leading-relaxed">{deal.desc}</p>
                  <Link to="/auth" className="inline-flex items-center gap-xs font-eyebrow text-[10px] text-on-surface uppercase tracking-widest hover:text-primary transition-colors group/link">
                    Explore Bundle <span className="material-symbols-outlined text-[14px] group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-xs text-on-surface-variant opacity-0 animate-reveal-up" style={{ animationDelay: '1.5s' }}>
            <div className="flex flex-col items-center gap-xs animate-bounce opacity-70">
              <span className="font-eyebrow text-eyebrow">SCROLL</span>
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl bg-background border-t border-outline/10 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
        <div className="flex flex-col md:flex-row justify-between items-center px-md md:px-xl max-w-container-max mx-auto relative z-10">
          <span className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant mb-md md:mb-0">
            © KAIROS 2024
          </span>
          <div className="flex gap-lg">
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300 hover:tracking-widest" href="#">Privacy</a>
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300 hover:tracking-widest" href="#">Terms</a>
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300 hover:tracking-widest" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroPage;
