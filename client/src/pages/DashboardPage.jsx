import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null, targetType: '', targetId: '', targetName: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, reviewText: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchBookings();
    }
  }, [token]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) setEvents(data.events);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings/mine', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) setBookings(data.bookings);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchBookings();
    } catch (e) { console.error(e); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: reviewModal.booking._id,
          targetType: reviewModal.targetType,
          targetId: reviewModal.targetId,
          rating: reviewForm.rating,
          reviewText: reviewForm.reviewText
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Review submitted successfully!');
        setReviewModal({ isOpen: false, booking: null, targetType: '', targetId: '', targetName: '' });
        setReviewForm({ rating: 5, reviewText: '' });
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting your review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openReviewModal = (booking, type, id, name) => {
    setReviewModal({ isOpen: true, booking, targetType: type, targetId: id, targetName: name });
    setReviewForm({ rating: 5, reviewText: '' });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pt-[88px] selection:bg-primary-container selection:text-on-primary">
      {/* TopNavBar handled by global App TopBar */}


      <main className="flex-grow w-full max-w-container-max mx-auto px-md md:px-xl py-xl space-y-xl">
        {/* Header Section */}
        <header className="flex flex-col gap-sm animate-reveal-up" style={{ animationDelay: '0.1s' }}>
          <p className="font-eyebrow text-eyebrow uppercase text-on-surface-variant tracking-widest">
            Assalam-o-Alaikum, {user?.fullName?.split(' ')[0] || 'Member'}
          </p>
          <h1 className="font-h1 text-h1 text-on-surface uppercase">Your KAIROS Dashboard</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
            You have {bookings.filter(b => b.status !== 'cancelled' && b.status !== 'complete').length} active reservations 
            {bookings.filter(b => b.status === 'complete').length > 0 && ` and ${bookings.filter(b => b.status === 'complete').length} completed booking${bookings.filter(b => b.status === 'complete').length > 1 ? 's' : ''}`}
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Left Column: Featured CTA */}
          <div className="lg:col-span-5 flex flex-col opacity-0 animate-reveal-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative flex-grow flex flex-col justify-end p-lg bg-surface-container-low border border-outline/30 rounded overflow-hidden group min-h-[400px]">
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDLFUkkqKNQ-SDIetYfdP91EsYeHRRBkXf9Aisd9zX6SyVUMxEkZddgIZsiwG-gUG-u68g7fHCjtBuG0XzCR5463cFKEeJrC2iFpNXz4z699xOmTWj9Q2OhzfPagdI2Ip29mvaWgeLcBsJp-BQztGtl-_OIuwC9qY6XA8du9EkdIPKPt9_hyhlgue2-ttvsUhfXqubBGQLDt-wChmb5tg2ROL0gA4-dC4KcmLJgSxordbKjnVPBN-DHYXCZ20yvqFJsW2BXpLErI0g')" }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/50 to-transparent"></div>
              <div className="relative z-10 flex flex-col gap-md">
                <h2 className="font-h2 text-h2 text-on-surface uppercase tracking-widest">Plan a New Event</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">Begin curating your next timeless moment with our bespoke planning concierge.</p>
                <div className="flex gap-sm mt-sm">
                  <button
                    onClick={() => navigate('/event-planner')}
                    className="self-start px-md py-sm bg-primary-container text-on-primary font-eyebrow text-eyebrow uppercase tracking-[0.1em] rounded hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    Use AI Planner
                  </button>
                  <button
                    onClick={() => navigate('/manual-planner')}
                    className="self-start px-md py-sm border border-primary-container text-primary-container font-eyebrow text-eyebrow uppercase tracking-[0.1em] rounded hover:bg-primary-container/20 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    Manual Selection
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Reservations */}
          <div className="lg:col-span-7 flex flex-col gap-md opacity-0 animate-reveal-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-sm mb-sm">
              <h3 className="font-eyebrow text-eyebrow uppercase text-on-surface tracking-widest">Active Reservations</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-eyebrow text-[10px]">
                {bookings.filter(b => b.status !== 'cancelled' && b.status !== 'complete').length}
              </span>
            </div>

            {bookings.filter(b => b.status !== 'cancelled' && b.status !== 'complete').length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center border border-outline/10 rounded border-dashed p-xl text-on-surface-variant italic font-body-sm">
                No active reservations found.
              </div>
            ) : (
              bookings.filter(b => b.status !== 'cancelled' && b.status !== 'complete').map((b, idx) => (
                <div
                  key={b._id}
                  className="p-md bg-surface-container border border-outline/30 rounded flex flex-col gap-md hover:border-primary/50 transition-all duration-500 hover:translate-x-1"
                  style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-xs">
                      <span className="font-eyebrow text-[10px] text-on-surface-variant uppercase tracking-widest font-mono">REF: {b.bookingRef || b._id.substring(0, 8).toUpperCase()}</span>
                      <h4 className="font-h2 text-h2 text-on-surface uppercase">{b.eventId?.eventType} — {b.eventId?.city}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{new Date(b.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className={`w-2 h-2 rounded-full ${b.status === 'confirmed' ? 'bg-primary shadow-[0_0_8px_rgba(24,0,173,0.6)]' : 'bg-surface-variant'} animate-pulse`}></span>
                      <span className={`font-eyebrow text-eyebrow uppercase tracking-widest ${b.status === 'confirmed' ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {b.status === 'pending' ? 'Awaiting Confirmation' : b.status}
                      </span>

                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-sm pt-sm border-t border-outline/10">
                    <div className="font-body-sm text-body-sm font-mono text-primary-fixed-dim uppercase tracking-wider">PKR {Number(b.totalPrice).toLocaleString()}</div>
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      className="px-sm py-xs border border-error/50 text-error font-eyebrow text-[10px] uppercase tracking-widest rounded hover:bg-error hover:text-on-error transition-all duration-300"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Bookings Section */}
        {bookings.filter(b => b.status === 'complete').length > 0 && (
          <div className="pt-xl border-t border-outline/10 opacity-0 animate-reveal-up" style={{ animationDelay: '0.9s' }}>
            <div className="flex items-center gap-sm mb-md">
              <h3 className="font-eyebrow text-eyebrow uppercase text-on-surface tracking-widest">Completed Bookings</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 font-eyebrow text-[10px]">
                {bookings.filter(b => b.status === 'complete').length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {bookings.filter(b => b.status === 'complete').map((b, idx) => (
                <div
                  key={b._id}
                  className="p-md bg-surface-container border border-outline/30 rounded flex flex-col gap-md hover:border-green-500/50 transition-all duration-500 hover:translate-y-[-2px] hover:shadow-lg"
                  style={{ animationDelay: `${0.95 + idx * 0.08}s` }}
                >
                  <div className="flex justify-between items-start gap-md">
                    <div className="flex flex-col gap-xs flex-grow">
                      <span className="font-eyebrow text-[10px] text-on-surface-variant uppercase tracking-widest font-mono">REF: {b.bookingRef || b._id.substring(0, 8).toUpperCase()}</span>
                      <h4 className="font-h2 text-h2 text-on-surface uppercase leading-tight">{b.eventId?.eventType}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{b.eventId?.city}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs pt-sm border-t border-outline/10">
                    <p className="font-eyebrow text-[9px] text-on-surface-variant uppercase tracking-widest">Event Date</p>
                    <p className="font-body-sm text-body-sm text-on-surface">{new Date(b.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <p className="font-eyebrow text-[9px] text-on-surface-variant uppercase tracking-widest">Total Cost</p>
                    <p className="font-h2 text-h2 text-primary-fixed-dim font-mono">PKR {Number(b.totalPrice).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col gap-sm mt-sm pt-sm border-t border-outline/10">
                    <p className="font-eyebrow text-[10px] text-on-surface-variant uppercase tracking-widest">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {b.venueId && (
                        <button 
                          onClick={() => openReviewModal(b, 'venue', b.venueId._id, b.venueId.name || 'Venue')} 
                          className="px-2 py-1 bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary font-eyebrow text-[9px] uppercase rounded transition-colors"
                        >
                          📍 Venue
                        </button>
                      )}
                      {b.cateringId && (
                        <button 
                          onClick={() => openReviewModal(b, 'catering', b.cateringId._id, b.cateringId.name || 'Catering')} 
                          className="px-2 py-1 bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary font-eyebrow text-[9px] uppercase rounded transition-colors"
                        >
                          🍽️ Catering
                        </button>
                      )}
                      {b.decoratorId && (
                        <button 
                          onClick={() => openReviewModal(b, 'vendor', b.decoratorId._id, b.decoratorId.name || 'Decorator')} 
                          className="px-2 py-1 bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary font-eyebrow text-[9px] uppercase rounded transition-colors"
                        >
                          ✨ Decor
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events Section */}
        <div className="pt-xl border-t border-outline/10 opacity-0 animate-reveal-up" style={{ animationDelay: '0.8s' }}>
          <h3 className="font-eyebrow text-eyebrow uppercase text-on-surface tracking-widest mb-md">Past Events Archive</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline/30">
                  <th className="py-sm px-sm font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest font-normal">Event Type</th>
                  <th className="py-sm px-sm font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest font-normal">City</th>
                  <th className="py-sm px-sm font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest font-normal">Guests</th>
                  <th className="py-sm px-sm font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest font-normal">Budget</th>
                  <th className="py-sm px-sm font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {events.map((e, idx) => (
                  <tr
                    key={e._id}
                    className="border-b border-outline/10 hover:bg-surface-container-low/50 transition-colors group"
                  >
                    <td className="py-md px-sm text-on-surface uppercase tracking-wider">{e.eventType}</td>
                    <td className="py-md px-sm text-on-surface-variant">{e.city}</td>
                    <td className="py-md px-sm text-on-surface-variant font-mono text-[13px]">{e.guestCount}</td>
                    <td className="py-md px-sm text-on-surface-variant font-mono text-[13px]">PKR {Number(e.budget).toLocaleString()}</td>
                    <td className="py-md px-sm text-right">
                      <button
                        onClick={() => navigate(`/recommendations/${e._id}`)}
                        className="font-eyebrow text-[10px] text-primary uppercase tracking-widest hover:tracking-[0.15em] transition-all duration-300"
                      >
                        View Recommendations →
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-xl text-center text-on-surface-variant italic">No event history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl border-t border-outline/10 mt-auto bg-background">
        <div className="flex flex-col md:flex-row justify-between items-center px-md md:px-xl max-w-container-max mx-auto gap-md">
          <span className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant">© KAIROS 2024</span>
          <div className="flex gap-md">
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
            <a className="font-eyebrow text-eyebrow uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-lg border border-outline/20 p-xl w-full max-w-md animate-reveal-up">
            <h3 className="font-h2 text-h2 text-on-surface uppercase mb-md">Review {reviewModal.targetName}</h3>
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-mono transition-colors ${reviewForm.rating >= num ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-widest">Your Feedback</label>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={e => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                  className="w-full bg-surface-container-high border border-outline/30 rounded p-sm text-on-surface font-body-sm focus:border-primary transition-colors min-h-[100px]"
                  placeholder="Tell us about your experience..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-md mt-sm">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, booking: null, targetType: '', targetId: '', targetName: '' })}
                  className="px-md py-sm text-on-surface-variant hover:text-on-surface font-eyebrow text-eyebrow uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-md py-sm bg-primary text-white font-eyebrow text-eyebrow uppercase tracking-widest rounded hover:bg-primary-fixed transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
