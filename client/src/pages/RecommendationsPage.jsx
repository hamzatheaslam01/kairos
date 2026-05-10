import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const TIER_STYLES = {
  STARTER: { color: '#5B8FB9', bg: 'rgba(91,143,185,0.08)', label: 'Starter', icon: 'eco' },
  ESSENTIAL: { color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', label: 'Essential', icon: 'bolt' },
  STANDARD: { color: '#1800ad', bg: 'rgba(24,0,173,0.08)', label: 'Standard', icon: 'auto_awesome' },
  PREMIUM: { color: '#312e81', bg: 'rgba(49,46,129,0.08)', label: 'Premium', icon: 'diamond' },
  LUXURY: { color: '#1e1b4b', bg: 'rgba(30,27,75,0.12)', label: 'Ultra Luxury', icon: 'workspace_premium' },
};


const RecommendationsPage = () => {
  const { eventId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('venues');
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState({ sortBy: 'rank' });

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCaterer, setSelectedCaterer] = useState(null);
  const [selectedDecorator, setSelectedDecorator] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [serviceReviews, setServiceReviews] = useState({});

  const fetchServiceReviews = async (type, id) => {
    if (serviceReviews[id]) return;
    try {
      const targetType = type === 'venues' ? 'venue' : type === 'catering' ? 'catering' : 'vendor';
      const res = await fetch(`/api/reviews/${targetType}/${id}`);
      const data = await res.json();
      if (res.ok) {
        setServiceReviews(prev => ({ ...prev, [id]: data.reviews }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/recommendations?eventId=${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const json = await res.json();
        setData(json);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchRecs();
  }, [eventId, token]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="text-primary font-eyebrow text-eyebrow uppercase tracking-[0.3em] flex items-center gap-4">
          <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse"></div>
          Curating Optimal Matches
          <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center gap-2 text-on-surface-variant/30 text-body-sm">
          <span className="material-symbols-outlined animate-spin text-primary font-[200]">progress_activity</span>
          <p className="uppercase tracking-widest font-eyebrow text-[10px]">Analyzing logistical infrastructure...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.recommendations) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-md">
        <span className="material-symbols-outlined text-error text-[48px] font-[200]">error</span>
        <div className="text-center">
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">LOGISTICS ERROR</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg uppercase tracking-widest">{error || 'Failed to fetch data'}</p>
          <button onClick={() => window.location.reload()} className="px-lg py-sm border border-primary text-primary font-eyebrow text-eyebrow uppercase tracking-widest hover:bg-primary/10 transition-colors">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const recs = data.recommendations;
  const tier = recs.tier || { key: 'STANDARD', label: 'Standard', venueCount: 3, catererCount: 3, decoratorCount: 3 };
  const tierStyle = TIER_STYLES[tier.key] || TIER_STYLES.STANDARD;
  const hasDecorators = recs.decorators && recs.decorators.length > 0;
  const isReadyToBook = selectedVenue && selectedCaterer && (hasDecorators ? selectedDecorator : true);
  const method = recs?.method || 'rule_based';
  const aiReasoning = recs?.reasoning || null;

  // Build dynamic tabs based on tier
  const tabs = [
    { id: 'venues', label: `01 / VENUES`, count: recs.venues?.length || 0 },
    { id: 'catering', label: `02 / CATERING`, count: recs.caterers?.length || 0 },
  ];
  if (hasDecorators) {
    tabs.push({ id: 'decorators', label: `03 / DECORATORS`, count: recs.decorators?.length || 0 });
  }

  const handleProceed = () => {
    if (!isReadyToBook) return;
    navigate(`/book/${eventId}`, { state: { venue: selectedVenue, caterer: selectedCaterer, decorator: selectedDecorator } });
  };

  const sortItems = (items) => {
    if (!items) return [];
    const sorted = [...items];
    if (filters.sortBy === 'price') sorted.sort((a, b) => (a.pricePerDay || a.effectivePrice || a.price || 0) - (b.pricePerDay || b.effectivePrice || b.price || 0));
    else if (filters.sortBy === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  };

  const currentItems = activeTab === 'venues' ? recs.venues : activeTab === 'catering' ? recs.caterers : recs.decorators;
  const sortedItems = sortItems(currentItems || []);

  // Calculate total if all selected
  const calcTotal = () => {
    let t = 0;
    if (selectedVenue) t += (selectedVenue.pricePerDay || 0);
    if (selectedCaterer) t += (selectedCaterer.effectivePrice || 0);
    if (selectedDecorator) t += (selectedDecorator.price || 0);
    return t;
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container antialiased pb-40 overflow-x-hidden">
      {/* Header handled by global App TopBar */}


      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-12 mt-32">
        {/* Page Actions */}
        <div className="flex justify-end gap-4 mb-8">
          <button onClick={() => setShowComparison(!showComparison)} className={`font-eyebrow text-[10px] uppercase tracking-[0.2em] px-6 py-2 transition-all duration-500 border flex items-center gap-2 group ${showComparison ? 'bg-primary text-background border-primary' : 'text-white/40 border-white/10 hover:border-primary/50 hover:text-white'}`}>
            <span className="material-symbols-outlined text-[16px] font-[200] group-hover:rotate-180 transition-transform duration-700">compare</span>
            {showComparison ? 'Exit Compare' : 'Compare Selection'}
          </button>
          <button onClick={() => navigate('/event-planner')} className="font-eyebrow text-[10px] uppercase tracking-[0.2em] text-primary/60 border border-primary/20 px-6 py-2 hover:bg-primary/5 transition-all hidden md:block">New Planning</button>
        </div>

        {/* Tier Badge */}
        <div className="mb-8 animate-reveal-up flex items-center gap-4">
          <div className="px-5 py-2 border flex items-center gap-3" style={{ borderColor: tierStyle.color + '40', background: tierStyle.bg }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: tierStyle.color }}>{tierStyle.icon}</span>
            <div>
              <span className="font-eyebrow text-[10px] uppercase tracking-[0.3em] block" style={{ color: tierStyle.color }}>{tier.label} Tier</span>
              <span className="font-eyebrow text-[8px] uppercase tracking-widest text-white/30">
                {tier.venueCount}V · {tier.catererCount}C · {tier.decoratorCount}D
              </span>
            </div>
          </div>
          {method === 'ai_powered' && (
            <div className="px-4 py-2 border border-primary/20 bg-primary/[0.03] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px] font-[200]">auto_awesome</span>
              <span className="font-eyebrow text-[9px] text-primary uppercase tracking-widest">AI Powered</span>
            </div>
          )}
        </div>

        {/* No decorators notice for low tiers */}
        {!hasDecorators && (
          <div className="mb-8 p-6 border border-white/10 bg-white/[0.02] flex items-start gap-4 animate-reveal-up" style={{ animationDelay: '0.1s' }}>
            <span className="material-symbols-outlined text-white/40 text-[24px] font-[200]">info</span>
            <div>
              <p className="font-eyebrow text-[11px] text-white/60 uppercase tracking-widest mb-1">Decoration Not Included</p>
              <p className="font-body text-sm text-white/30 leading-relaxed">Your budget tier focuses on essential services (Venue + Catering). Consider venues with in-house decoration to maximize your budget. Upgrade your budget above PKR 700,000 to unlock decorator options.</p>
            </div>
          </div>
        )}

        {showComparison ? (
          <div className="animate-reveal-up">
            <div className="mb-12">
              <h1 className="font-h1 text-4xl mb-3 text-white uppercase tracking-tight font-light">Side-by-Side Analysis</h1>
              <p className="font-body text-white/40 uppercase tracking-[0.3em] text-[10px]">Evaluating logistical synergy across selections</p>
            </div>
            <div className={`grid grid-cols-1 gap-8 mb-20 ${hasDecorators ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {[
                { label: 'Venue', item: selectedVenue, type: 'venue' },
                { label: 'Caterer', item: selectedCaterer, type: 'caterer' },
                ...(hasDecorators ? [{ label: 'Decorator', item: selectedDecorator, type: 'decorator' }] : [])
              ].map(({ label, item, type }, idx) => (
                <div key={type} className={`bg-white/[0.02] border p-8 flex flex-col min-h-[450px] transition-all duration-700 animate-reveal-up ${item ? 'border-primary/40 shadow-[0_0_50px_rgba(197,160,89,0.05)]' : 'border-white/5 border-dashed opacity-40'}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <span className="font-eyebrow text-[10px] text-primary uppercase tracking-[0.4em] mb-8">{label}</span>
                  {item ? (
                    <>
                      <div className="relative group overflow-hidden mb-8">
                        <img src={item.imageUrl || (item.images && item.images[0]) || `https://source.unsplash.com/featured/?${type}&sig=${item._id}`} className="w-full h-56 object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" alt={item.name} />
                      </div>
                      <h3 className="font-h2 text-2xl text-white mb-3 uppercase font-light tracking-wide">{item.name}</h3>
                      <p className="font-body text-sm text-white/40 mb-8 flex-grow leading-relaxed font-light">{item.description}</p>
                      <div className="border-t border-white/5 pt-6 mt-auto">
                        <div className="flex justify-between mb-3">
                          <span className="font-eyebrow text-[10px] text-white/30 uppercase tracking-widest">Investment</span>
                          <span className="font-body text-primary tracking-tighter">Rs. {Number(item.pricePerDay || item.effectivePrice || item.price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-eyebrow text-[10px] text-white/30 uppercase tracking-widest">Rating</span>
                          <div className="flex items-center text-primary/80 text-[14px]">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i + 0.5 < (item.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center gap-6 text-white/10">
                      <span className="material-symbols-outlined text-[64px] font-[100] animate-pulse">add_circle</span>
                      <p className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-center">Selection Pending</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Total cost summary */}
            {isReadyToBook && (
              <div className="p-6 border border-primary/20 bg-primary/[0.03] flex justify-between items-center mb-8">
                <span className="font-eyebrow text-[11px] text-white/60 uppercase tracking-widest">Estimated Total</span>
                <span className="font-h2 text-2xl text-primary">PKR {calcTotal().toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header & Tabs */}
            <div className="mb-16 animate-reveal-up">
              <h1 className="font-h1 text-5xl mb-12 text-white uppercase tracking-tight font-light">Logistics Hub</h1>
              <div className="flex border-b border-white/5 gap-12 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setExpandedId(null); }}
                    className={`pb-6 border-b-[3px] font-eyebrow text-[12px] uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap relative group flex items-center gap-3 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-white/30 hover:text-white/60'}`}>
                    {tab.label}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-16 animate-reveal-up" style={{ animationDelay: '0.1s' }}>
              {[{ label: 'Rank', value: 'rank' }, { label: 'Price', value: 'price' }, { label: 'Rating', value: 'rating' }].map(opt => (
                <button key={opt.value} onClick={() => setFilters({ ...filters, sortBy: opt.value })}
                  className={`px-8 py-2 border font-eyebrow text-[10px] uppercase tracking-widest transition-all duration-500 ${filters.sortBy === opt.value ? 'bg-primary/10 border-primary text-primary' : 'border-white/10 text-white/40 hover:border-white/30'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <span className="material-symbols-outlined text-[64px] font-[200] mb-4">inventory_2</span>
                <p className="font-eyebrow text-[11px] uppercase tracking-widest">No options available in this category for your tier</p>
              </div>
            ) : (
              <div className={`grid gap-10 ${sortedItems.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : sortedItems.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {sortedItems.map((item, idx) => {
                  const isSelected = (activeTab === 'venues' && selectedVenue?._id === item._id) ||
                    (activeTab === 'catering' && selectedCaterer?._id === item._id) ||
                    (activeTab === 'decorators' && selectedDecorator?._id === item._id);
                  const handleSelect = () => {
                    if (activeTab === 'venues') setSelectedVenue(item);
                    if (activeTab === 'catering') setSelectedCaterer(item);
                    if (activeTab === 'decorators') setSelectedDecorator(item);
                  };

                  return (
                    <div key={item._id} className={`relative bg-white/[0.01] border flex flex-col group overflow-hidden transition-all duration-700 animate-reveal-up ${isSelected ? 'border-primary shadow-[0_0_40px_rgba(24,0,173,0.1)]' : 'border-white/5 hover:border-white/20'}`} style={{ animationDelay: `${idx * 0.05}s` }}>

                      {isSelected && <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none"></div>}
                      <div className="h-72 w-full relative overflow-hidden cursor-pointer" onClick={() => {
                        setExpandedId(expandedId === item._id ? null : item._id);
                        fetchServiceReviews(activeTab, item._id);
                      }}>
                        <img alt={item.name} className={`object-cover w-full h-full transition-all duration-[1.5s] group-hover:scale-110 ${!isSelected && 'grayscale contrast-125 brightness-75 group-hover:grayscale-0 group-hover:brightness-100'}`}
                          src={(item.images && item.images.length > 0) ? item.images[0] : item.imageUrl || `https://source.unsplash.com/featured/?${activeTab === 'venues' ? 'luxury,mansion' : activeTab === 'catering' ? 'fine-dining' : 'decor'}&sig=${item._id}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10 flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[14px] ${isSelected ? 'text-primary' : 'text-white/40'} font-[200]`}>military_tech</span>
                          <span className={`font-eyebrow text-[9px] ${isSelected ? 'text-primary' : 'text-white/40'} uppercase tracking-[0.2em]`}>RANK {idx + 1}</span>
                        </div>
                        <div className="absolute bottom-6 right-6">
                          <span className={`material-symbols-outlined text-white/40 transition-transform duration-500 ${expandedId === item._id ? 'rotate-180' : ''}`}>expand_more</span>
                        </div>
                      </div>
                      <div className="p-10 flex flex-col flex-grow relative z-10">
                        <div className="mb-6">
                          <h3 className="font-h2 text-2xl text-white mb-2 uppercase font-light tracking-wide">{item.name}</h3>
                          <p className="font-body text-[11px] text-white/30 flex items-center gap-2 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[16px] font-[200] text-primary/60">location_on</span> {item.city || 'National'}
                          </p>
                        </div>

                        {expandedId === item._id ? (
                          <div className="animate-reveal-up mb-8 flex flex-col gap-8">
                            <div>
                              <h4 className="font-eyebrow text-[10px] text-primary uppercase tracking-[0.3em] mb-4">Strategic Overview</h4>
                              <p className="font-body text-sm text-white/50 leading-relaxed font-light">
                                {item.description || "A premium offering curated specifically to meet the high standards of your event parameters and logistical requirements."}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-eyebrow text-[10px] text-primary uppercase tracking-[0.3em] mb-4">Guest Feedback</h4>
                              <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {[...(serviceReviews[item._id] || [])].sort(() => Math.random() - 0.5).slice(0, 3).map(rev => (
                                  <div key={rev._id} className="p-4 bg-white/5 border border-white/5 rounded-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-primary/60 text-[10px]">{'★'.repeat(rev.rating)}</span>
                                      <span className="font-eyebrow text-[8px] text-white/20 uppercase tracking-widest">{rev.userId?.fullName || 'Verified Guest'}</span>
                                    </div>
                                    <p className="font-body text-[12px] text-white/40 italic font-light leading-snug">"{rev.reviewText}"</p>
                                  </div>
                                ))}
                                {(serviceReviews[item._id] || []).length === 0 && <p className="text-[10px] text-white/20 italic uppercase tracking-widest">Awaiting public consensus...</p>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-body text-sm text-white/40 line-clamp-3 mb-6 leading-relaxed font-light">
                              {item.description || "A premium offering curated for your event parameters."}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-8">
                              {(item.tags || item.specialties || item.amenities || []).slice(0, 4).map(tag => (
                                <span key={tag} className="px-2 py-[2px] border border-white/10 text-white/30 font-eyebrow text-[8px] uppercase tracking-widest">{tag}</span>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="flex justify-between items-end mt-auto mb-10">
                          <div className="font-body text-primary text-sm">PKR {Number(item.pricePerDay || item.effectivePrice || item.price || 0).toLocaleString()}</div>
                          <div className="flex items-center text-primary/60">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i + 0.5 < (item.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                        </div>
                        <button onClick={handleSelect}
                          className={`w-full py-4 border font-eyebrow text-[11px] uppercase tracking-[0.3em] flex justify-center items-center gap-3 transition-all duration-500 relative overflow-hidden group/btn ${isSelected ? 'bg-primary text-background border-primary' : 'border-white/10 text-white/60 hover:border-primary hover:text-primary'}`}>
                          {!isSelected && <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>}
                          <span className="relative z-10">{isSelected ? 'SELECTED' : 'SELECT OFFERING'}</span>
                          <span className={`material-symbols-outlined text-[16px] font-[200] relative z-10 ${isSelected ? 'scale-110' : ''}`}>{isSelected ? 'check_circle' : 'arrow_forward_ios'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 w-full bg-black/80 backdrop-blur-2xl border-t border-white/5 z-[60]">
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex gap-12 flex-grow w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
              <span className="font-eyebrow text-[10px] text-white/20 uppercase tracking-[0.4em]">01 Venue</span>
              <div className={`border-b pb-2 text-white font-body text-sm flex justify-between items-center transition-all duration-500 ${selectedVenue ? 'border-primary' : 'border-white/5 italic text-white/10'}`}>
                <span className="truncate">{selectedVenue ? selectedVenue.name : 'Unselected'}</span>
                {selectedVenue && <span className="material-symbols-outlined text-primary text-[18px] font-[200]">verified</span>}
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
              <span className="font-eyebrow text-[10px] text-white/20 uppercase tracking-[0.4em]">02 Caterer</span>
              <div className={`border-b pb-2 text-white font-body text-sm flex justify-between items-center transition-all duration-500 ${selectedCaterer ? 'border-primary' : 'border-white/5 italic text-white/10'}`}>
                <span className="truncate">{selectedCaterer ? selectedCaterer.name : 'Unselected'}</span>
                {selectedCaterer && <span className="material-symbols-outlined text-primary text-[18px] font-[200]">verified</span>}
              </div>
            </div>
            {hasDecorators && (
              <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
                <span className="font-eyebrow text-[10px] text-white/20 uppercase tracking-[0.4em]">03 Decor</span>
                <div className={`border-b pb-2 text-white font-body text-sm flex justify-between items-center transition-all duration-500 ${selectedDecorator ? 'border-primary' : 'border-white/5 italic text-white/10'}`}>
                  <span className="truncate">{selectedDecorator ? selectedDecorator.name : 'Unselected'}</span>
                  {selectedDecorator && <span className="material-symbols-outlined text-primary text-[18px] font-[200]">verified</span>}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleProceed} disabled={!isReadyToBook}
            className={`px-12 py-4 font-eyebrow text-[11px] uppercase tracking-[0.4em] whitespace-nowrap transition-all duration-700 relative overflow-hidden group ${isReadyToBook ? 'bg-primary text-background hover:shadow-[0_0_50px_rgba(197,160,89,0.2)] cursor-pointer' : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed opacity-50'}`}>
            {isReadyToBook && <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>}
            <span className="relative z-10">Finalize Logistics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;
