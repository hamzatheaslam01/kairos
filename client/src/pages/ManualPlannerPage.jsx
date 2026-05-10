import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

const ManualPlannerPage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: 'Wedding',
    budget: '',
    guestCount: 150,
    city: 'Lahore',
    date: ''
  });

  const [venues, setVenues] = useState([]);
  const [caterers, setCaterers] = useState([]);
  const [decorators, setDecorators] = useState([]);

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCaterer, setSelectedCaterer] = useState(null);
  const [selectedDecorator, setSelectedDecorator] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [serviceReviews, setServiceReviews] = useState({});

  const eventTypes = ['Wedding', 'Corporate', 'Gala', 'Private Dinner', 'Birthday'];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Other'];

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const vRes = await fetch('/api/venues', { headers });
        if (vRes.status === 401) { logout(); return; }
        if (vRes.ok) {
          const vData = await vRes.json();
          const fetchedVenues = Array.isArray(vData) ? vData : (vData.venues || vData.data || []);
          setVenues(fetchedVenues);
        }
      } catch (err) {
        console.error('Failed to fetch venues', err);
      }

      try {
        const cRes = await fetch('/api/catering', { headers });
        if (cRes.status === 401) { logout(); return; }
        if (cRes.ok) {
          const cData = await cRes.json();
          const fetchedCaterers = Array.isArray(cData) ? cData : (cData.caterers || cData.data || []);
          setCaterers(fetchedCaterers);
        }
      } catch (err) {
        console.error('Failed to fetch catering', err);
      }

      try {
        const dRes = await fetch('/api/vendors', { headers });
        if (dRes.status === 401) { logout(); return; }
        if (dRes.ok) {
          const dData = await dRes.json();
          const fetchedVendors = Array.isArray(dData) ? dData : (dData.vendors || dData.data || []);
          const decs = fetchedVendors.filter(v => v.category === 'decoration');
          setDecorators(decs);
        }
      } catch (err) {
        console.error('Failed to fetch decorators (vendors endpoint)', err);
      }
    };
    if (token) fetchData();
  }, [token, logout]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.date) {
      setError('Please select an event date.');
      return;
    }
    if (step === 2 && !selectedVenue) {
      setError('Please select a venue.');
      return;
    }
    if (step === 3 && !selectedCaterer) {
      setError('Please select a caterer.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const fetchServiceReviews = async (type, id) => {
    if (serviceReviews[id]) return;
    try {
      const res = await fetch(`/api/reviews/${type}/${id}`);
      const data = await res.json();
      if (res.ok) {
        setServiceReviews(prev => ({ ...prev, [id]: data.reviews }));
      }
    } catch (e) { console.error(e); }
  };

  const handleStepChange = (newStep) => {
    setStep(newStep);
    setExpandedId(null);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  // Calculate effective catering price same way as recommendations service
  const getCateringPrice = () => {
    if (!selectedCaterer) return 0;
    const guestCount = Number(formData.guestCount) || 150;
    if (selectedCaterer.pricingType === 'per_person' || !selectedCaterer.pricingType) {
      return (selectedCaterer.pricePerPerson || 0) * guestCount;
    }
    return selectedCaterer.flatPrice || 0;
  };

  const calculateTotal = () => {
    let total = 0;
    if (selectedVenue) total += selectedVenue.pricePerDay || 0;
    if (selectedCaterer) total += getCateringPrice();
    if (selectedDecorator) total += selectedDecorator?.price || 0;
    return total;
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Validation: Ensure guestCount is at least 1
      const guestCount = Number(formData.guestCount) || 150;
      const totalExpense = calculateTotal();
      
      // Validation check: Ensure prices are correctly added
      let priceBreakdown = '';
      if (selectedVenue) priceBreakdown += `Venue: ${(selectedVenue.pricePerDay || 0).toLocaleString()}; `;
      if (selectedCaterer) priceBreakdown += `Catering: ${getCateringPrice().toLocaleString()}; `;
      if (selectedDecorator) priceBreakdown += `Decorator: ${(selectedDecorator.price || 0).toLocaleString()}; `;
      console.log(`[Price Validation] ${priceBreakdown} Total: ${totalExpense.toLocaleString()}`);
      
      if (totalExpense === 0) {
        throw new Error('Total expense cannot be zero. Please select all required services.');
      }

      // 1. Create Event
      const eventRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          event_type: formData.eventType,
          budget: totalExpense, // Use calculated total as budget
          guest_count: Math.max(guestCount, 1),
          city: formData.city,
          event_date: formData.date || new Date().toISOString()
        })
      });

      const eventData = await eventRes.json();
      if (!eventRes.ok) throw new Error(eventData.error || 'Failed to create event');
      const eventId = eventData.event._id;

      // 2. Create Booking with totalPrice
      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          event_id: eventId,
          venue_id: selectedVenue._id,
          caterer_id: selectedCaterer ? selectedCaterer._id : null,
          decor_id: selectedDecorator ? selectedDecorator._id : null,
          event_date: formData.date || new Date().toISOString(),
          totalPrice: totalExpense
        })
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || 'Failed to create booking');

      alert('Event successfully booked! Awaiting admin confirmation.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      console.error('Booking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter based on city, using robust comparison
  const filteredVenues = venues.filter(v => v.city && formData.city && v.city.trim().toLowerCase() === formData.city.trim().toLowerCase());
  const filteredCaterers = caterers.filter(c => c.city && formData.city && c.city.trim().toLowerCase() === formData.city.trim().toLowerCase());
  const filteredDecorators = decorators.filter(d => d.city && formData.city && d.city.trim().toLowerCase() === formData.city.trim().toLowerCase());

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body pt-[120px] selection:bg-primary-container selection:text-on-primary-container">
      <main className="flex-grow w-full max-w-[1000px] mx-auto px-gutter py-xl">
        <div className="mb-xl text-center">
          <h1 className="font-h1 text-h1 text-on-surface uppercase tracking-tight">Manual Selection</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">Curate your own bespoke event by selecting vendors manually.</p>
        </div>

        {/* Stepper Indicator */}
        <nav className="mb-xl border-b border-outline/30 pb-md">
          <ol className="flex justify-between items-center text-center relative">
            {['DETAILS', 'VENUE', 'CATERING', 'DECOR', 'CONFIRM'].map((label, index) => (
              <li key={label} className="relative flex-1">
                <span className={`font-eyebrow text-[10px] tracking-[0.2em] uppercase block transition-all duration-500 ${step === index + 1 ? 'text-primary scale-110' : 'text-on-surface-variant'}`}>
                  {label}
                </span>
                {step === index + 1 && (
                  <div className="absolute -bottom-[25px] left-0 right-0 h-[2px] bg-primary"></div>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {error && (
          <div className="mb-md p-md bg-error/10 border border-error/20 text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        <div className="bg-surface-container-low/50 backdrop-blur-md border border-outline/30 p-lg rounded-sm relative min-h-[400px] pb-32">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="flex flex-col gap-lg animate-reveal-up">
              <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Initial Planning</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div>
                  <label className="font-eyebrow text-[10px] uppercase text-on-surface-variant tracking-widest mb-xs block">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={e => handleInputChange('eventType', e.target.value)}
                    className="w-full bg-surface-container-high border border-outline/30 rounded p-sm text-on-surface outline-none focus:border-primary transition-all"
                  >
                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-eyebrow text-[10px] uppercase text-on-surface-variant tracking-widest mb-xs block">City</label>
                  <select
                    value={formData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    className="w-full bg-surface-container-high border border-outline/30 rounded p-sm text-on-surface outline-none focus:border-primary transition-all"
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-eyebrow text-[10px] uppercase text-on-surface-variant tracking-widest mb-xs block">Event Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => handleInputChange('date', e.target.value)}
                    className="w-full bg-surface-container-high border border-outline/30 rounded p-sm text-on-surface outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="p-md bg-primary/5 border border-primary/20 rounded">
                <p className="font-body-sm text-body-sm text-on-surface-variant">We've set a baseline budget and guest count for you. You can refine these during the final review.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Venue */}
          {step === 2 && (
            <div className="flex flex-col gap-lg animate-reveal-up">
              <div className="flex justify-between items-center mb-lg">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest">Select Venue in {formData.city}</h2>
                <span className="text-on-surface-variant text-sm font-body">{filteredVenues.length} options available</span>
              </div>
              {filteredVenues.length === 0 ? (
                <div className="text-center py-xl">
                  <p className="text-on-surface-variant italic">No venues found for {formData.city}.</p>
                  <button onClick={handlePrevStep} className="mt-md text-primary font-eyebrow text-[10px] uppercase tracking-widest underline">Change City</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg pb-xl">
                  {filteredVenues.map((v, idx) => {
                    const isSelected = selectedVenue?._id === v._id;
                    return (
                      <div
                        key={v._id}
                        className={`border rounded-lg transition-all duration-500 overflow-hidden flex flex-col animate-reveal-up ${isSelected ? 'border-primary shadow-[0_0_30px_rgba(24,0,173,0.15)] bg-primary/5' : 'border-outline/30 bg-surface-container hover:border-primary/50 hover:shadow-lg'}`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {/* Image Section */}
                        <div className="relative w-full h-56 overflow-hidden cursor-pointer group" onClick={() => { setExpandedId(expandedId === v._id ? null : v._id); fetchServiceReviews('venue', v._id); }}>
                          <img 
                            src={v.images?.[0] || v.imageUrl || `https://source.unsplash.com/featured/?luxury,venue&sig=${v._id}`}
                            alt={v.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${!isSelected && 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100'}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40"></div>
                          <div className="absolute top-3 left-3 bg-primary/80 px-3 py-1 rounded text-white text-[10px] font-eyebrow uppercase tracking-widest">
                            {v.capacity || 'N/A'} Pax
                          </div>
                          {isSelected && <div className="absolute top-3 right-3 bg-primary px-2 py-1 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-white">check_circle</span>
                            <span className="text-white text-[9px] font-eyebrow uppercase">Selected</span>
                          </div>}
                        </div>

                        {/* Content Section */}
                        <div className="p-lg flex flex-col flex-grow">
                          <h3 className="font-h2 text-on-surface uppercase mb-2 line-clamp-2">{v.name || 'Unnamed Venue'}</h3>
                          <p className="font-body-sm text-on-surface-variant text-[11px] mb-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {v.city || 'Unknown City'}
                          </p>

                          {/* Description */}
                          {expandedId !== v._id && (
                            <p className="font-body-sm text-on-surface-variant text-sm mb-md line-clamp-2 leading-relaxed">
                              {v.description || 'Premium venue offering exceptional service and ambiance.'}
                            </p>
                          )}

                          {/* Expanded Content */}
                          {expandedId === v._id && (
                            <div className="mb-md pb-md border-b border-outline/10 animate-reveal-up">
                              <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2">Overview</h4>
                              <p className="font-body-sm text-on-surface-variant text-sm mb-3 leading-relaxed">
                                {v.description || 'Premium venue offering exceptional service and ambiance.'}
                              </p>
                              {v.amenities?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {v.amenities.slice(0, 4).map((amenity, i) => (
                                    <span key={i} className="text-[8px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest font-eyebrow">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2 mt-3">Guest Reviews</h4>
                              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                                {(serviceReviews[v._id] || []).slice(0, 2).map(rev => (
                                  <div key={rev._id} className="p-2 bg-surface-container-high/30 rounded border border-outline/10 text-[10px]">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-primary">{'★'.repeat(rev.rating || 4)}</span>
                                      <span className="text-on-surface-variant text-[8px]">{rev.userId?.fullName || 'Guest'}</span>
                                    </div>
                                    <p className="text-on-surface-variant text-[9px] italic">"{rev.reviewText?.substring(0, 60)}..."</p>
                                  </div>
                                )) || <p className="text-[9px] text-on-surface-variant">Loading reviews...</p>}
                              </div>
                            </div>
                          )}

                          {/* Price & Rating */}
                          <div className="flex justify-between items-end mt-auto pt-lg border-t border-outline/10">
                            <div>
                              <p className="font-eyebrow text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Price / Day</p>
                              <p className="font-h3 text-primary">PKR {v.pricePerDay ? v.pricePerDay.toLocaleString() : 0}</p>
                            </div>
                            <div className="flex items-center text-primary/70">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i + 0.5 < (v.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                              ))}
                            </div>
                          </div>

                          {/* Select Button */}
                          <button 
                            onClick={() => setSelectedVenue(v)}
                            className={`w-full mt-lg py-md font-eyebrow text-[10px] uppercase tracking-widest rounded transition-all border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-transparent border-outline/30 text-on-surface hover:border-primary hover:text-primary'}`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Catering */}
          {step === 3 && (
            <div className="flex flex-col gap-lg animate-reveal-up">
              <div className="flex justify-between items-center mb-lg">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest">Select Catering</h2>
                <div className="flex items-center gap-md">
                  <label className="font-eyebrow text-[9px] uppercase text-on-surface-variant tracking-widest">Guests:</label>
                  <input
                    type="number"
                    value={formData.guestCount}
                    onChange={e => handleInputChange('guestCount', e.target.value)}
                    placeholder="0"
                    className="w-20 bg-surface-variant border border-outline/30 rounded px-2 py-1 text-on-surface text-xs outline-none focus:border-primary"
                  />
                  <span className="text-on-surface-variant text-sm font-body ml-md">{filteredCaterers.length} options</span>
                </div>
              </div>
              {filteredCaterers.length === 0 ? (
                <div className="text-center py-xl">
                  <p className="text-on-surface-variant italic">No caterers found for {formData.city}.</p>
                  <button onClick={() => setStep(step + 1)} className="mt-md text-primary font-eyebrow text-[10px] uppercase tracking-widest underline">Skip Catering</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg pb-xl">
                  {filteredCaterers.map((c, idx) => {
                    const isSelected = selectedCaterer?._id === c._id;
                    return (
                      <div
                        key={c._id}
                        className={`border rounded-lg transition-all duration-500 overflow-hidden flex flex-col animate-reveal-up ${isSelected ? 'border-primary shadow-[0_0_30px_rgba(24,0,173,0.15)] bg-primary/5' : 'border-outline/30 bg-surface-container hover:border-primary/50 hover:shadow-lg'}`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {/* Image Section */}
                        <div className="relative w-full h-56 overflow-hidden cursor-pointer group" onClick={() => { setExpandedId(expandedId === c._id ? null : c._id); fetchServiceReviews('catering', c._id); }}>
                          <img 
                            src={c.images?.[0] || c.imageUrl || `https://source.unsplash.com/featured/?fine-dining,catering&sig=${c._id}`}
                            alt={c.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${!isSelected && 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100'}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40"></div>
                          <div className="absolute top-3 left-3 bg-primary/80 px-3 py-1 rounded text-white text-[10px] font-eyebrow uppercase tracking-widest">
                            Catering
                          </div>
                          {isSelected && <div className="absolute top-3 right-3 bg-primary px-2 py-1 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-white">check_circle</span>
                            <span className="text-white text-[9px] font-eyebrow uppercase">Selected</span>
                          </div>}
                        </div>

                        {/* Content Section */}
                        <div className="p-lg flex flex-col flex-grow">
                          <h3 className="font-h2 text-on-surface uppercase mb-2 line-clamp-2">{c.name}</h3>
                          <p className="font-body-sm text-on-surface-variant text-[11px] mb-md">
                            {c.specialties?.slice(0, 2).join(', ') || 'Premium Catering Services'}
                          </p>

                          {/* Description */}
                          {expandedId !== c._id && (
                            <p className="font-body-sm text-on-surface-variant text-sm mb-md line-clamp-2 leading-relaxed">
                              {c.description || 'Exceptional culinary services for your event.'}
                            </p>
                          )}

                          {/* Expanded Content */}
                          {expandedId === c._id && (
                            <div className="mb-md pb-md border-b border-outline/10 animate-reveal-up">
                              <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2">Specialties</h4>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {c.specialties?.slice(0, 5).map((spec, i) => (
                                  <span key={i} className="text-[8px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest font-eyebrow">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                              <p className="font-body-sm text-on-surface-variant text-sm mb-3 leading-relaxed">
                                {c.description || 'Exceptional culinary services for your event.'}
                              </p>
                              {c.menus?.length > 0 && (
                                <>
                                  <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2 mt-3">Menu Options</h4>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {c.menus.slice(0, 3).map((menu, i) => (
                                      <span key={i} className="text-[8px] px-2 py-1 bg-surface-container-high border border-outline/20 rounded font-eyebrow">
                                        {menu.name} • PKR {menu.pricePerPerson}/pp
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                              <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2 mt-3">Guest Reviews</h4>
                              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                                {(serviceReviews[c._id] || []).slice(0, 2).map(rev => (
                                  <div key={rev._id} className="p-2 bg-surface-container-high/30 rounded border border-outline/10 text-[10px]">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-primary">{'★'.repeat(rev.rating || 4)}</span>
                                      <span className="text-on-surface-variant text-[8px]">{rev.userId?.fullName || 'Guest'}</span>
                                    </div>
                                    <p className="text-on-surface-variant text-[9px] italic">"{rev.reviewText?.substring(0, 60)}..."</p>
                                  </div>
                                )) || <p className="text-[9px] text-on-surface-variant">Loading reviews...</p>}
                              </div>
                            </div>
                          )}

                          {/* Price & Rating */}
                          <div className="flex justify-between items-end mt-auto pt-lg border-t border-outline/10">
                            <div>
                              <p className="font-eyebrow text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Est. Cost ({formData.guestCount || 150} pax)</p>
                              <p className="font-h3 text-primary">PKR {(((c.pricingType === 'per_person' || !c.pricingType) ? (c.pricePerPerson || 0) * (formData.guestCount || 150) : (c.flatPrice || 0))).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center text-primary/70">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i + 0.5 < (c.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                              ))}
                            </div>
                          </div>

                          {/* Select Button */}
                          <button 
                            onClick={() => setSelectedCaterer(c)}
                            className={`w-full mt-lg py-md font-eyebrow text-[10px] uppercase tracking-widest rounded transition-all border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-transparent border-outline/30 text-on-surface hover:border-primary hover:text-primary'}`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Decor */}
          {step === 4 && (
            <div className="flex flex-col gap-lg animate-reveal-up">
              <div className="flex justify-between items-center mb-lg">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest">Select Decorator (Optional)</h2>
                <span className="text-on-surface-variant text-sm font-body">{filteredDecorators.length} options available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg pb-xl">
                {/* Skip Decoration Card */}
                <div
                  onClick={() => setSelectedDecorator(null)}
                  className={`border rounded-lg cursor-pointer transition-all duration-500 h-96 flex items-center justify-center ${selectedDecorator === null ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(24,0,173,0.15)]' : 'border-outline/30 bg-surface-container hover:border-primary/50 hover:shadow-lg'}`}
                >
                  <div className="flex flex-col items-center gap-md">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant">done</span>
                    <span className="font-eyebrow text-on-surface uppercase tracking-widest">Skip Decoration</span>
                  </div>
                </div>

                {/* Decorator Cards */}
                {filteredDecorators.map((d, idx) => {
                  const isSelected = selectedDecorator?._id === d._id;
                  return (
                    <div
                      key={d._id}
                      className={`border rounded-lg transition-all duration-500 overflow-hidden flex flex-col animate-reveal-up ${isSelected ? 'border-primary shadow-[0_0_30px_rgba(24,0,173,0.15)] bg-primary/5' : 'border-outline/30 bg-surface-container hover:border-primary/50 hover:shadow-lg'}`}
                      style={{ animationDelay: `${(idx + 1) * 0.05}s` }}
                    >
                      {/* Image Section */}
                      <div className="relative w-full h-56 overflow-hidden cursor-pointer group" onClick={() => { setExpandedId(expandedId === d._id ? null : d._id); fetchServiceReviews('vendor', d._id); }}>
                        <img 
                          src={d.images?.[0] || d.imageUrl || `https://source.unsplash.com/featured/?decoration,event&sig=${d._id}`}
                          alt={d.name}
                          className={`w-full h-full object-cover transition-all duration-500 ${!isSelected && 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40"></div>
                        <div className="absolute top-3 left-3 bg-primary/80 px-3 py-1 rounded text-white text-[10px] font-eyebrow uppercase tracking-widest">
                          {d.serviceType || 'Decoration'}
                        </div>
                        {isSelected && <div className="absolute top-3 right-3 bg-primary px-2 py-1 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-white">check_circle</span>
                          <span className="text-white text-[9px] font-eyebrow uppercase">Selected</span>
                        </div>}
                      </div>

                      {/* Content Section */}
                      <div className="p-lg flex flex-col flex-grow">
                        <h3 className="font-h2 text-on-surface uppercase mb-2 line-clamp-2">{d.name}</h3>
                        <p className="font-body-sm text-on-surface-variant text-[11px] mb-md">
                          {d.category || 'Professional Decoration'}
                        </p>

                        {/* Description */}
                        {expandedId !== d._id && (
                          <p className="font-body-sm text-on-surface-variant text-sm mb-md line-clamp-2 leading-relaxed">
                            {d.description || 'Professional decoration services for your special event.'}
                          </p>
                        )}

                        {/* Expanded Content */}
                        {expandedId === d._id && (
                          <div className="mb-md pb-md border-b border-outline/10 animate-reveal-up">
                            <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2">Expertise</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {d.tags?.slice(0, 5).map((tag, i) => (
                                <span key={i} className="text-[8px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest font-eyebrow">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="font-body-sm text-on-surface-variant text-sm mb-3 leading-relaxed">
                              {d.description || 'Professional decoration services for your special event.'}
                            </p>
                            <h4 className="font-eyebrow text-[9px] text-primary uppercase tracking-widest mb-2 mt-3">Guest Reviews</h4>
                            <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                              {(serviceReviews[d._id] || []).slice(0, 2).map(rev => (
                                <div key={rev._id} className="p-2 bg-surface-container-high/30 rounded border border-outline/10 text-[10px]">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-primary">{'★'.repeat(rev.rating || 4)}</span>
                                    <span className="text-on-surface-variant text-[8px]">{rev.userId?.fullName || 'Guest'}</span>
                                  </div>
                                  <p className="text-on-surface-variant text-[9px] italic">"{rev.reviewText?.substring(0, 60)}..."</p>
                                </div>
                              )) || <p className="text-[9px] text-on-surface-variant">Loading reviews...</p>}
                            </div>
                          </div>
                        )}

                        {/* Price & Rating */}
                        <div className="flex justify-between items-end mt-auto pt-lg border-t border-outline/10">
                          <div>
                            <p className="font-eyebrow text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">Package Cost</p>
                            <p className="font-h3 text-primary">PKR {d.price ? d.price.toLocaleString() : 0}</p>
                          </div>
                          <div className="flex items-center text-primary/70">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i + 0.5 < (d.rating || 4.5) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                        </div>

                        {/* Select Button */}
                        <button 
                          onClick={() => setSelectedDecorator(d)}
                          className={`w-full mt-lg py-md font-eyebrow text-[10px] uppercase tracking-widest rounded transition-all border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-transparent border-outline/30 text-on-surface hover:border-primary hover:text-primary'}`}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Confirm */}
          {step === 5 && (
            <div className="flex flex-col gap-lg animate-reveal-up">
              <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Final Expense Details</h2>
              <div className="bg-black/40 border border-outline/20 p-md rounded flex flex-col gap-md">
                <div className="flex justify-between border-b border-outline/10 pb-xs">
                  <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest">Venue ({selectedVenue?.name})</span>
                  <span className="text-on-surface">PKR {(selectedVenue?.pricePerDay || 0).toLocaleString()}</span>
                </div>
                {selectedCaterer && (
                  <div className="flex justify-between border-b border-outline/10 pb-xs">
                    <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest">Catering ({selectedCaterer?.name} x {formData.guestCount || 0})</span>
                    <span className="text-on-surface">PKR {(getCateringPrice() || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-outline/10 pb-xs">
                  <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest">Decoration ({selectedDecorator?.name || 'None'})</span>
                  <span className="text-on-surface">PKR {(selectedDecorator?.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-sm">
                  <span className="text-primary font-h2 uppercase tracking-widest text-lg">Total Expense</span>
                  <span className="text-primary font-h2 uppercase tracking-widest text-lg">PKR {calculateTotal().toLocaleString()}</span>
                </div>
                <div className="mt-sm pt-sm border-t border-outline/10 grid grid-cols-2 gap-sm">
                  <div>
                    <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest text-[9px] block">Event Type</span>
                    <span className="text-on-surface text-sm font-medium">{formData.eventType}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest text-[9px] block">Date</span>
                    <span className="text-on-surface text-sm font-medium">{formData.date || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest text-[9px] block">City</span>
                    <span className="text-on-surface text-sm font-medium">{formData.city}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-eyebrow uppercase tracking-widest text-[9px] block">Guests</span>
                    <span className="text-on-surface text-sm font-medium">{formData.guestCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-xl pt-lg border-t border-outline/30 flex justify-between items-center bg-background/50 backdrop-blur-sm sticky bottom-0 z-20">
            {step > 1 ? (
              <button onClick={handlePrevStep} disabled={isLoading} className="text-on-surface-variant font-eyebrow text-[10px] uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
              </button>
            ) : <div></div>}

            {step < 5 ? (
              <button onClick={handleNextStep} className="bg-primary text-on-primary px-lg py-sm rounded-sm font-eyebrow text-[10px] uppercase tracking-[0.2em] hover:bg-primary-fixed hover:scale-105 transition-all flex items-center gap-xs shadow-lg">
                Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button onClick={handleConfirmBooking} disabled={isLoading} className="bg-primary text-on-primary px-xl py-sm rounded-sm font-eyebrow text-[10px] uppercase tracking-[0.2em] hover:bg-primary-fixed hover:scale-105 transition-all flex items-center gap-sm disabled:opacity-50 shadow-2xl">
                {isLoading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                CONFIRM RESERVATION
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualPlannerPage;
