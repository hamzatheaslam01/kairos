import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

const BookingPage = () => {
  const { eventId } = useParams();
  const { state } = useLocation();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('2025-10-15');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');

  // If accessed directly without state, bounce back
  useEffect(() => {
    if (!state || !state.venue) {
      navigate('/dashboard');
    }
  }, [state, navigate]);

  if (!state) return null;

  const { venue, caterer, decorator } = state;
  const totalInvestment = (venue?.pricePerDay || 0) + (caterer?.effectivePrice || caterer?.price || 0) + (decorator?.effectivePrice || decorator?.price || 0);

  const handleCheckAvailability = async () => {
    if (!date) return;
    setChecking(true);
    setAvailability(null);
    try {
      const res = await fetch(`/api/venues/${venue?._id}/availability?date=${date}`, {

        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setAvailability(data.available);
    } catch (e) {
      console.error(e);
      setAvailability(false);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirm = async () => {
    if (!availability || !date) return;
    setBookingStatus('loading');
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          event_id: eventId,
          venue_id: venue?._id,
          caterer_id: caterer?._id,
          decor_id: decorator?._id,
          event_date: date,
          guest_count: guestCount,
          notes: notes
        })

      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to confirm booking');
      
      setBookingStatus('success');
    } catch (e) {
      setBookingStatus('error');
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="bg-background text-on-background font-body antialiased min-h-screen flex flex-col pt-32 selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* TopNavBar handled by global App TopBar */}


      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-12 py-12 flex flex-col lg:flex-row gap-20 items-start">
        {/* Left Column: Selection Summary */}
        <section className="w-full lg:w-5/12 flex flex-col gap-12 animate-reveal-up">
          <header>
            <div className="inline-block mb-4">
              <span className="font-eyebrow text-[10px] text-primary uppercase tracking-[0.4em] mb-2 block">Curation Report</span>
              <div className="h-px w-12 bg-primary/40"></div>
            </div>
            <h1 className="font-h1 text-4xl uppercase tracking-tight text-white mb-6 font-light">Reservation<br />Manifest</h1>
            <p className="font-body text-white/40 leading-relaxed font-light">Review the curated elements for your upcoming event. This selection reflects your refined taste and our commitment to excellence.</p>
          </header>
          
          <div className="flex flex-col gap-8 border-y border-white/5 py-12">
            {/* Venue */}
            <div className="flex justify-between items-start group">
              <div>
                <p className="font-eyebrow text-[10px] text-white/20 mb-2 uppercase tracking-widest">Venue</p>
                <p className="font-body text-lg text-white uppercase tracking-wide group-hover:text-primary transition-colors duration-500">{venue?.name}</p>
              </div>
              <p className="font-body text-white tracking-tighter pt-5">Rs. {Number(venue?.pricePerDay).toLocaleString()}</p>
            </div>
            {/* Caterer */}
            <div className="flex justify-between items-start group">
              <div>
                <p className="font-eyebrow text-[10px] text-white/20 mb-2 uppercase tracking-widest">Catering</p>
                <p className="font-body text-lg text-white uppercase tracking-wide group-hover:text-primary transition-colors duration-500">{caterer?.name}</p>
              </div>
              <p className="font-body text-white tracking-tighter pt-5">Rs. {Number(caterer?.effectivePrice || caterer?.price).toLocaleString()}</p>
            </div>
            {/* Decorator */}
            <div className="flex justify-between items-start group">
              <div>
                <p className="font-eyebrow text-[10px] text-white/20 mb-2 uppercase tracking-widest">Floral & Decor</p>
                <p className="font-body text-lg text-white uppercase tracking-wide group-hover:text-primary transition-colors duration-500">{decorator?.name}</p>
              </div>
              <p className="font-body text-white tracking-tighter pt-5">Rs. {Number(decorator?.effectivePrice || decorator?.price).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex justify-between items-end bg-white/[0.02] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <div className="relative z-10">
              <p className="font-eyebrow text-[10px] text-white/40 uppercase tracking-[0.4em] mb-1">Total Investment</p>
              <p className="font-body text-4xl text-primary tracking-tighter font-light">Rs. {Number(totalInvestment).toLocaleString()}</p>
            </div>
            <span className="material-symbols-outlined text-white/10 text-6xl font-[100] relative z-10">payments</span>
          </div>
        </section>

        {/* Right Column: Booking Form */}
        <section className="w-full lg:w-7/12 bg-white/[0.01] border border-white/5 p-8 lg:p-16 relative overflow-hidden animate-reveal-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          <h2 className="font-h1 text-3xl text-white mb-12 uppercase tracking-tight font-light">Finalize Logistics</h2>
          
          {bookingStatus === 'error' && (
            <div className="mb-12 p-6 bg-error/5 border border-error/20 text-error font-body text-xs uppercase tracking-widest flex items-center gap-4 animate-reveal-in">
              <span className="material-symbols-outlined text-lg">error</span>
              {errorMsg}
            </div>
          )}

          <form className="flex flex-col gap-10" onSubmit={e => e.preventDefault()}>
            {/* Date Selection */}
            <div className="flex flex-col gap-4">
              <label className="font-eyebrow text-[10px] text-white/30 uppercase tracking-[0.4em]" htmlFor="event-date">01 Event Date</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow group">
                  <input 
                    className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-4 font-body text-white focus:ring-0 focus:border-primary transition-all duration-500 [color-scheme:dark] placeholder:text-white/10" 
                    id="event-date" 
                    type="date" 
                    value={date}
                    onChange={e => { setDate(e.target.value); setAvailability(null); }}
                  />
                </div>
                <button 
                  onClick={handleCheckAvailability}
                  disabled={!date || checking}
                  className={`px-8 py-4 border font-eyebrow text-[11px] uppercase tracking-[0.3em] transition-all duration-500 whitespace-nowrap disabled:opacity-30 ${checking ? 'border-primary/50 text-primary' : 'border-white/10 text-white/60 hover:border-primary hover:text-primary'}`} 
                  type="button"
                >
                  {checking ? 'Scanning Registry...' : 'Verify Availability'}
                </button>
              </div>
            </div>

            {/* Availability Result */}
            {availability !== null && (
              <div className={`p-6 border flex items-center gap-6 transition-all duration-700 animate-reveal-in ${availability ? 'bg-primary/[0.03] border-primary/20' : 'bg-error/5 border-error/20'}`}>
                <div className="relative">
                  <span className={`material-symbols-outlined text-2xl font-[100] ${availability ? 'text-primary' : 'text-error'}`}>
                    {availability ? 'verified' : 'block'}
                  </span>
                  {availability && <div className="absolute inset-0 bg-primary/20 blur-lg animate-pulse"></div>}
                </div>
                <div>
                  <p className={`font-body text-sm leading-relaxed ${availability ? 'text-white/70' : 'text-error/80'}`}>
                    {availability ? 'The selected date is currently available across all chosen vendors. Our infrastructure is ready.' : 'The selected date has logistical conflicts. Please select an alternative timeframe.'}
                  </p>
                </div>
              </div>
            )}

            {/* Guest Count */}
            <div className="flex flex-col gap-4 animate-reveal-up" style={{ animationDelay: '0.3s' }}>
              <label className="font-eyebrow text-[10px] text-white/30 uppercase tracking-[0.4em]" htmlFor="guest-count">02 Estimated Attendance</label>
              <div className="relative group">
                <input 
                  className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-4 font-body text-white focus:ring-0 focus:border-primary transition-all duration-500 placeholder:text-white/10" 
                  id="guest-count" 
                  placeholder="Anticipated guest count..." 
                  type="number"
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="flex flex-col gap-4 animate-reveal-up" style={{ animationDelay: '0.4s' }}>
              <label className="font-eyebrow text-[10px] text-white/30 uppercase tracking-[0.4em]" htmlFor="special-requests">03 Special Requirements</label>
              <textarea 
                className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-4 font-body text-white focus:ring-0 focus:border-primary transition-all duration-500 resize-none min-h-[100px] placeholder:text-white/10" 
                id="special-requests" 
                placeholder="Directives for the concierge team..." 
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-12 border-t border-white/5 mt-8 animate-reveal-up" style={{ animationDelay: '0.5s' }}>
              <button 
                onClick={handleConfirm}
                disabled={!availability || bookingStatus === 'loading'}
                className={`w-full font-eyebrow text-[12px] uppercase tracking-[0.5em] py-6 transition-all duration-700 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.3)] ${
                  availability && bookingStatus !== 'loading'
                    ? 'bg-primary text-background hover:shadow-[0_0_60px_rgba(197,160,89,0.1)]'
                    : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed opacity-50'
                }`} 
                type="button"
              >
                {bookingStatus === 'loading' && <div className="absolute inset-0 bg-white/10 animate-shimmer"></div>}
                <span className="relative z-10">{bookingStatus === 'loading' ? 'Orchestrating...' : 'Secure Reservation'}</span>
              </button>
              <p className="text-center font-body text-[10px] text-white/20 uppercase tracking-widest mt-6">By proceeding, you acknowledge our terms of engagement.</p>
            </div>
          </form>

          {/* Success State Overlay */}
          <div className={`${bookingStatus === 'success' ? 'flex' : 'hidden'} absolute inset-0 bg-black/95 backdrop-blur-3xl z-50 flex-col items-center justify-center p-16 text-center animate-fadeIn`}>
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop" className="w-full h-full object-cover animate-slow-zoom" alt="Success background" />
              <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
            </div>
            
            <div className="relative z-10 animate-reveal-up flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center mb-8 relative">
                <span className="material-symbols-outlined text-primary text-5xl font-[100]">task_alt</span>
                <div className="absolute inset-0 border border-primary rounded-full animate-ping opacity-20"></div>
              </div>
              <h3 className="font-h1 text-5xl text-white mb-4 uppercase tracking-[0.2em] font-light">Reservation<br />Secured</h3>
              <div className="h-px w-16 bg-primary/40 mb-8"></div>
              <p className="font-body text-lg text-white/60 mb-12 max-w-md font-light leading-relaxed">Your concierge has been notified. We are now orchestrating the finer details of your engagement.</p>
              
              <div className="bg-white/[0.03] border border-white/10 py-6 px-10 mb-16 group">
                <p className="font-eyebrow text-[10px] text-white/20 uppercase mb-2 tracking-[0.4em]">Reference Folio</p>
                <p className="font-body text-xl text-primary tracking-[0.4em] font-light">KAI-{new Date().getTime().toString().slice(-8)}</p>
              </div>

              <button 
                onClick={() => navigate('/dashboard')}
                className="group flex flex-col items-center gap-2"
              >
                <span className="font-eyebrow text-[11px] text-white/40 uppercase tracking-[0.4em] group-hover:text-primary transition-colors">Return to Dashboard</span>
                <div className="h-px w-0 group-hover:w-16 bg-primary/30 transition-all duration-700"></div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-transparent mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-[1440px] mx-auto gap-12">
          <p className="font-eyebrow text-[10px] uppercase tracking-[0.4em] text-white/20">© KAIROS 2024</p>
          <div className="flex gap-12">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a key={link} className="font-eyebrow text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-primary transition-all duration-500 relative group" href="#">
                {link}
                <div className="absolute -bottom-1 left-0 w-0 h-px bg-primary/30 group-hover:w-full transition-all duration-500"></div>
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>

  );
};

export default BookingPage;
