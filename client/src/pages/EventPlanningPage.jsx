import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';

const EventPlanningPage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: '',
    budget: '',
    guestCount: '',
    city: '',
    vibe: '',
    date: '',
    preferences: []
  });
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const eventTypes = [
    { label: 'WEDDING', value: 'Wedding', icon: 'favorite' },
    { label: 'CORPORATE', value: 'Corporate', icon: 'work' },
    { label: 'GALA', value: 'Gala', icon: 'celebration' },
    { label: 'PRIVATE DINNER', value: 'Private Dinner', icon: 'restaurant' },
    { label: 'BIRTHDAY', value: 'Birthday', icon: 'cake' },
    { label: 'SEMINAR', value: 'Seminar', icon: 'school' },
    { label: 'EXHIBITION', value: 'Exhibition', icon: 'museum' },
    { label: 'CHARITY', value: 'Charity', icon: 'volunteer_activism' }
  ];

  const cities = [
    { name: 'Karachi', value: 'Karachi', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCe4i5vUeGLp4TNK067oRlesDpDCGjjMl9MRUTplShTD-t2qoccSM7uNUHf5PmZ5lTecJC-yBAz3UwuKkZDl89Z2PI_dyWV-cdgI30mRCWg0st09QfL19UkTkWnpW-7hwTgaLO4GZfdA6aNEF4DW_j8UiWybc7CjSz2GwzfB3c3J_-cvbxgzaqHFdg8fzmRqot9-PRVZqmipIrxOlYV9kRxxVQO00HU4VObnA50-cTp5ZimjUukvYGQfiA_a0bLTrjEUy24vQNbtXY' },
    { name: 'Lahore', value: 'Lahore', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0BBOOxejeGdID6P9_DQDFkVcUx3jLjcYVLJVIxWXALhL4uMAVnvFEIyquTeS2criIn2ycK-y192-TPknU_01ZO5F7Blumh6vXczIDBKgxl1dRN-hfdGymmjstmXv43pjtUIcJPcNkRTno7b0IWc5fa_akPackmfOoCN3WXeONRSrvyktmTlUzO1KWEy8FFR9ErY6e5nlD56LRwSfEDPUdEnt5_4NGM5N3v775WfreOyHURlbALO2aDPyfaGiXwdaasDWzvl9z4zk' },
    { name: 'Islamabad', value: 'Islamabad', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj3EOzikIO1cN1H2kHmYDzkBRTeqXxP03AQIQd6EMWsZp1zA696dI_xq6EYpPMp8sYVMYiT8VHnzFfd-DhXGgRtu45HKc_bJEkoYSRLP5_MOF7hLmNGEaPH_H4sGq6mg8bi5StWjrzigKPxwCkmTkQ7qgDzOwcfIk-lOthlQEbBTgvMFXus4b6zCVXzOE8kUNfRRn9CvDlfGnAHSPzOn4CDlJF05ZjV_ICda6iwlhD3AmNDyMKRxm3YgeAZ3h0gy1pxn_m-mZ7OnQ' },
    { name: 'Rawalpindi', value: 'Rawalpindi', icon: 'home_work' },
    { name: 'Faisalabad', value: 'Faisalabad', icon: 'factory' },
    { name: 'Multan', value: 'Multan', icon: 'location_city' },
    { name: 'Peshawar', value: 'Peshawar', icon: 'castle' },
    { name: 'Other', value: 'Other', icon: 'public' }
  ];

  const vibes = [
    { label: 'Elegant', value: 'Elegant' },
    { label: 'Modern Minimalist', value: 'Modern Minimalist' },
    { label: 'Heritage Traditional', value: 'Heritage Traditional' },
    { label: 'Opulent Luxury', value: 'Opulent Luxury' }
  ];
  
  const preferenceOptions = [
    { label: 'Outdoor Space', value: 'Outdoor' },
    { label: 'Rooftop Venue', value: 'Rooftop' },
    { label: 'Valet Parking', value: 'Valet' },
    { label: 'Halal Certified', value: 'Halal' },
    { label: 'Live Music/DJ', value: 'Live Music' },
    { label: 'Alcohol Permitted', value: 'Alcohol' },
    { label: 'Desi Menu', value: 'Desi' },
    { label: 'Continental', value: 'Continental' },
    { label: 'Pan-Asian', value: 'Pan-Asian' },
    { label: 'Wheelchair Access', value: 'Wheelchair' },
    { label: 'Audio/Visual Gear', value: 'AV Support' },
    { label: 'Security Staff', value: 'Security' },
    { label: 'Prayer Area', value: 'Prayer Area' },
    { label: 'Air Conditioning', value: 'AC' }
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const togglePreference = (tag) => {
    const current = formData.preferences;
    if (current.includes(tag)) {
      setFormData({ ...formData, preferences: current.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, preferences: [...current, tag] });
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.eventType || !formData.budget || !formData.guestCount)) {
      setError('Please fill in all required fields');
      return;
    }
    if (step === 2 && (!formData.city || !formData.vibe)) {
      setError('Please select location and aesthetic');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/ai/event-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: formData.eventType,
          budget: Number(formData.budget),
          guest_count: Number(formData.guestCount),
          city: formData.city,
          vibe: formData.vibe,
          preferences: formData.preferences
        })
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      
      setPlan(data.plan);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to generate event plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: formData.eventType,
          budget: formData.budget,
          guest_count: formData.guestCount,
          city: formData.city,
          preferences: { 
            vibe: formData.vibe,
            tags: formData.preferences 
          },
          event_date: formData.date || new Date().toISOString()
        })
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      navigate(`/recommendations/${data.event._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container antialiased">
      {/* TopNavBar handled by global App TopBar */}


      <main className="flex-grow w-full max-w-[900px] mx-auto px-gutter py-xl flex flex-col pt-[120px]">
        {/* Stepper Header */}
        <div className="flex flex-col gap-sm items-center text-center mb-xl animate-reveal-up" style={{ animationDelay: '0.1s' }}>
          <p className="font-eyebrow text-eyebrow text-primary uppercase tracking-widest">Step 0{step}</p>
          <h1 className="font-h1 text-h1 text-on-surface uppercase tracking-tight">
            {step === 1 && "Event Details"}
            {step === 2 && "Location & Vibe"}
            {step === 3 && "Confirm Selection"}
            {step === 4 && "Your Event Strategy"}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-sm">
            {step === 1 && "Begin by defining the scope and scale of your upcoming event."}
            {step === 2 && "Select your preferred city and define the aesthetic direction."}
            {step === 3 && "Review your parameters before our AI drafts your blueprint."}
            {step === 4 && "A bespoke strategic plan curated by KAIROS logic."}
          </p>
        </div>

        {/* Stepper Indicator */}
        <nav className="mb-xl border-b border-outline/30 pb-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ol className="flex justify-between items-center text-center relative" role="list">
            {['DETAILS', 'LOCALE', 'CONFIRM', 'STRATEGY'].map((label, index) => (
              <li key={label} className="relative flex-1">
                <span className={`font-eyebrow text-[10px] md:text-eyebrow tracking-[0.2em] uppercase block transition-all duration-500 ${step === index + 1 ? 'text-primary scale-110' : 'text-on-surface-variant'}`}>
                  {label}
                </span>
                {step === index + 1 && (
                  <div className="absolute -bottom-[25px] left-0 right-0 h-[2px] bg-primary animate-reveal-in"></div>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-md bg-error/10 border border-error/20 flex items-start gap-sm animate-reveal-up">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <p className="font-body-sm text-body-sm text-error">{error}</p>
          </div>
        )}

        {/* Step Content Container with Transition */}
        <div className="flex-grow flex flex-col relative pb-32">
          {/* Step 1 Content */}
          {step === 1 && (
            <div className="flex-1 flex flex-col gap-xl animate-reveal-up" key="step1">
              <section>
                <h2 className="font-eyebrow text-eyebrow text-on-surface mb-md uppercase tracking-widest">Select Event Type</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                  {eventTypes.map((type, idx) => (
                    <button
                      key={type.value}
                      onClick={() => handleInputChange('eventType', type.value)}
                      className={`flex flex-col items-center justify-center p-md transition-all h-32 border group ${
                        formData.eventType === type.value
                          ? 'bg-primary/5 border-primary text-primary shadow-[0_0_15px_rgba(233,193,118,0.1)]'
                          : 'bg-transparent border-outline/30 text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                      }`}
                      style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                    >
                      <span className={`material-symbols-outlined text-[32px] mb-sm transition-transform duration-500 group-hover:scale-110 ${formData.eventType === type.value ? 'animate-reveal-in' : ''}`}>{type.icon}</span>
                      <span className="font-eyebrow text-[10px] tracking-widest uppercase">{type.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-xl">
                <div className="relative group">
                  <label className="font-eyebrow text-eyebrow text-on-surface-variant absolute -top-md left-0 uppercase tracking-widest transition-colors group-focus-within:text-primary">Total Budget (PKR) — All Inclusive</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="e.g. 5,000,000"
                    className="w-full bg-transparent border-0 border-b border-outline/30 py-sm px-0 font-h2 text-h2 text-on-surface focus:ring-0 focus:border-primary placeholder:text-on-surface-variant/30 transition-all outline-none"
                  />
                  {/* Live Tier Indicator */}
                  {formData.budget && Number(formData.budget) > 0 && (() => {
                    const b = Number(formData.budget);
                    const tiers = [
                      { min: 0, max: 300000, label: 'Starter', color: '#8B9467', desc: 'Venue + 1 Caterer', icon: 'eco' },
                      { min: 300000, max: 700000, label: 'Essential', color: '#5B8FB9', desc: 'Venue + 2 Caterers', icon: 'bolt' },
                      { min: 700000, max: 1500000, label: 'Standard', color: '#C5A059', desc: 'Venue + Catering + Decorator', icon: 'auto_awesome' },
                      { min: 1500000, max: 5000000, label: 'Premium', color: '#B4769A', desc: 'Full Luxury Suite', icon: 'diamond' },
                      { min: 5000000, max: Infinity, label: 'Ultra Luxury', color: '#D4AF37', desc: 'Elite Bespoke Experience', icon: 'workspace_premium' },
                    ];
                    const tier = tiers.find(t => b >= t.min && b < t.max) || tiers[0];
                    return (
                      <div className="mt-3 flex items-center gap-3 animate-reveal-up">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: tier.color }}>{tier.icon}</span>
                        <span className="font-eyebrow text-[10px] uppercase tracking-widest" style={{ color: tier.color }}>{tier.label} Tier</span>
                        <span className="text-on-surface-variant/40 text-[10px]">—</span>
                        <span className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-wider">{tier.desc}</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="relative group">
                  <label className="font-eyebrow text-eyebrow text-on-surface-variant absolute -top-md left-0 uppercase tracking-widest transition-colors group-focus-within:text-primary">Guest Count</label>
                  <input
                    type="number"
                    value={formData.guestCount}
                    onChange={(e) => handleInputChange('guestCount', e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full bg-transparent border-0 border-b border-outline/30 py-sm px-0 font-h2 text-h2 text-on-surface focus:ring-0 focus:border-primary placeholder:text-on-surface-variant/30 transition-all outline-none"
                  />
                </div>
              </section>

              <div className="mt-xl flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-primary text-on-primary font-eyebrow text-eyebrow uppercase tracking-[0.1em] px-lg py-sm rounded-sm flex items-center gap-base hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Next Step <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 Content */}
          {step === 2 && (
            <div className="flex-1 flex flex-col gap-xl animate-reveal-up" key="step2">
              <section className="flex flex-col gap-md">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Destination</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                  {cities.map((city, idx) => (
                    <label 
                      key={city.value} 
                      className="cursor-pointer group relative overflow-hidden rounded-sm h-32 border border-outline/30 hover:border-primary/50 transition-all"
                      style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                    >
                      <input
                        type="radio"
                        name="city"
                        value={city.value}
                        checked={formData.city === city.value}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="peer sr-only"
                      />
                      {city.image ? (
                        <div className="h-full w-full relative transition-all">
                          <img src={city.image} alt={city.name} className={`w-full h-full object-cover transition-all duration-1000 ${formData.city === city.value ? 'scale-110 brightness-110' : 'grayscale opacity-60'}`} />
                          <div className={`absolute inset-0 ${formData.city === city.value ? 'bg-primary/10' : 'bg-surface-dim/50'}`}></div>
                          <div className="absolute bottom-sm left-sm right-sm z-10 flex justify-between items-end">
                            <span className="font-h2 text-h2 text-on-surface drop-shadow-xl uppercase tracking-tighter">{city.name}</span>
                            {formData.city === city.value && (
                              <span className="material-symbols-outlined text-primary font-[200] animate-reveal-in" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full w-full flex flex-col items-center justify-center transition-all duration-500 ${formData.city === city.value ? 'bg-primary/5' : 'bg-surface-container-low'}`}>
                          <span className={`material-symbols-outlined text-[32px] mb-xs transition-transform duration-500 group-hover:scale-110 ${formData.city === city.value ? 'text-primary' : 'text-on-surface-variant'}`}>{city.icon}</span>
                          <span className={`font-h2 text-h2 uppercase tracking-tighter ${formData.city === city.value ? 'text-on-surface' : 'text-on-surface-variant'}`}>{city.name}</span>
                        </div>
                      )}
                      {formData.city === city.value && (
                        <div className="absolute inset-0 border-2 border-primary z-20 pointer-events-none animate-reveal-in"></div>
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-md">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Event Aesthetic</h2>
                <div className="flex flex-wrap gap-sm">
                  {vibes.map((v, idx) => (
                    <label key={v.value} className="cursor-pointer" style={{ animationDelay: `${0.4 + idx * 0.1}s` }}>
                      <input
                        type="radio"
                        name="vibe"
                        value={v.value}
                        checked={formData.vibe === v.value}
                        onChange={(e) => handleInputChange('vibe', e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="px-md py-sm border border-outline/30 text-on-surface-variant font-body-sm text-body-sm rounded-full peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all hover:border-primary/50 hover:scale-105 uppercase tracking-widest">
                        {v.label}
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-md">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Options & Preferences</h2>
                <div className="flex flex-wrap gap-sm">
                  {preferenceOptions.map((opt, idx) => (
                    <button
                      key={opt.value}
                      onClick={() => togglePreference(opt.value)}
                      className={`px-md py-sm border rounded-full font-body-sm text-body-sm transition-all hover:scale-105 uppercase tracking-widest ${
                        formData.preferences.includes(opt.value)
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline/30 text-on-surface-variant hover:border-primary/50'
                      }`}
                      style={{ animationDelay: `${0.5 + idx * 0.05}s` }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-md">
                <h2 className="font-eyebrow text-eyebrow text-on-surface uppercase tracking-widest border-b border-outline/30 pb-sm">Proposed Date</h2>
                <div className="w-full md:w-1/2 relative group">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full bg-surface-variant border border-outline/30 text-on-surface font-body text-body rounded-sm px-sm py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none font-[200] group-focus-within:text-primary transition-colors">calendar_month</span>
                </div>
              </section>

              <div className="mt-xl flex justify-between items-center border-t border-outline/30 pt-md">
                <button onClick={handleBack} className="text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-[0.2em] hover:text-primary transition-all flex items-center gap-xs hover:-translate-x-1">
                  <span className="material-symbols-outlined font-[200] text-[18px]">arrow_back</span> Back
                </button>
                <button onClick={handleNext} className="bg-primary text-on-primary font-eyebrow text-eyebrow uppercase tracking-[0.1em] px-lg py-sm rounded-sm hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all flex items-center gap-xs shadow-lg">
                  Next Step <span className="material-symbols-outlined font-[200] text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3 Content */}
          {step === 3 && (
            <div className="flex-1 flex flex-col gap-xl animate-reveal-up items-center" key="step3">
              <div className="w-full bg-surface-container-low/70 backdrop-blur-[20px] border border-outline/30 rounded-sm p-lg relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-1000 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg relative z-10">
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.2s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Event Type</span>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary/70 text-[20px]">celebration</span>
                      <span className="font-h2 text-h2 text-on-surface uppercase">{formData.eventType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.3s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Budget Tier</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary/70 text-[20px]">account_balance</span>
                        <span className="font-h2 text-h2 text-on-surface">PKR {Number(formData.budget).toLocaleString()}</span>
                      </div>
                      <span className={`text-[9px] font-eyebrow uppercase tracking-tighter ${Number(formData.budget) < 1000000 ? 'text-warning' : 'text-primary/60'}`}>
                        {Number(formData.budget) < 1000000 ? 'Essential Service Strategy' : 'Premium Multi-Vendor Strategy'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.4s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Guest Count</span>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary/70 text-[20px]">groups</span>
                      <span className="font-h2 text-h2 text-on-surface">{formData.guestCount}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.5s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Location</span>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary/70 text-[20px]">location_on</span>
                      <span className="font-h2 text-h2 text-on-surface uppercase">{formData.city}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.6s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Aesthetic Vibe</span>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary/70 text-[20px]">palette</span>
                      <span className="font-h2 text-h2 text-on-surface uppercase">{formData.vibe}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs animate-reveal-up" style={{ animationDelay: '0.7s' }}>
                    <span className="font-eyebrow text-[10px] text-on-surface-variant tracking-widest uppercase">Proposed Date</span>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary/70 text-[20px]">calendar_month</span>
                      <span className="font-h2 text-h2 text-on-surface uppercase">{formData.date || 'TBD'}</span>
                    </div>
                  </div>
                </div>
                {formData.preferences.length > 0 && (
                  <div className="mt-md flex flex-wrap gap-xs animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    {formData.preferences.map(pref => (
                      <span key={pref} className="px-xs py-[2px] bg-primary/10 border border-primary/20 text-primary font-eyebrow text-[9px] uppercase tracking-tighter rounded-full">
                        {pref}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-lg pt-md border-t border-outline/20 flex justify-end">
                  <button onClick={() => setStep(1)} className="font-eyebrow text-[10px] text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 uppercase tracking-widest hover:tracking-[0.15em]">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit Details
                  </button>
                </div>
              </div>

              <div className="text-center max-w-lg mt-lg animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <p className="font-body-sm text-body-sm text-on-surface-variant/70 flex items-start gap-sm justify-center">
                  <span className="material-symbols-outlined text-[18px] opacity-70 mt-1">info</span>
                  <span>By proceeding, KAIROS AI will analyze top-tier vendors and generate a comprehensive preliminary blueprint tailored to your specifications.</span>
                </p>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="bg-primary-container text-on-primary-container font-eyebrow text-eyebrow uppercase tracking-[0.2em] px-xl py-md rounded-sm hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all flex items-center gap-sm w-full md:w-auto justify-center shadow-2xl border border-primary-container disabled:opacity-50 mt-md group"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>progress_activity</span>
                    CALCULATING STRATEGY...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    GENERATE MY PLAN
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4 Content: Plan Results */}
          {step === 4 && plan && (
            <div className="flex flex-col gap-xl animate-reveal-up" key="step4">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline/20 pb-lg">
                <div className="animate-reveal-up" style={{ animationDelay: '0.1s' }}>
                  <span className="inline-flex items-center gap-xs px-sm py-xs border border-primary/30 text-primary font-eyebrow text-[10px] uppercase tracking-widest rounded-sm mb-md bg-primary/5 animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI-STRATEGY
                  </span>
                  <h1 className="font-hero-display-mobile md:font-hero-display text-hero-display-mobile md:text-hero-display text-on-surface uppercase tracking-tight">THE BLUEPRINT</h1>
                </div>
                <button className="flex items-center justify-center gap-xs text-on-surface-variant font-eyebrow text-[10px] uppercase tracking-widest hover:text-primary transition-all hover:tracking-widest animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <span className="material-symbols-outlined text-[18px]">download</span> Export PDF
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
                {/* Left Column: Budget */}
                <div className="md:col-span-5 flex flex-col gap-md opacity-0 animate-reveal-up" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-surface-container-low/70 backdrop-blur-xl border border-outline/30 rounded-sm p-lg relative overflow-hidden h-full group">
                    <div className="absolute top-0 right-0 p-md opacity-10 group-hover:scale-110 transition-transform duration-1000">
                      <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
                    </div>
                    <h2 className="font-h2 text-h2 text-on-surface uppercase tracking-widest mb-lg border-b border-outline/10 pb-xs">Capital Allocation</h2>
                    <div className="space-y-lg">
                      {plan.budget_allocation && Object.entries(plan.budget_allocation).map(([category, amount], idx) => {
                        const percentage = Math.round((amount / formData.budget) * 100);
                        return (
                          <div key={category} className="animate-reveal-up" style={{ animationDelay: `${0.5 + idx * 0.1}s` }}>
                            <div className="flex justify-between font-eyebrow text-[10px] text-on-surface-variant mb-xs">
                              <span className="uppercase tracking-widest">{category.replace(/_/g, ' ')}</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, opacity: 1 - (idx * 0.15) }}></div>
                            </div>
                            <div className="mt-xs font-body-sm text-body-sm text-on-surface-variant text-right font-mono">PKR {Number(amount).toLocaleString()}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-lg pt-md border-t border-outline/20">
                      <div className="flex justify-between items-end">
                        <span className="font-eyebrow text-[10px] text-on-surface-variant uppercase tracking-widest">Planned Total</span>
                        <span className="font-h2 text-h2 text-primary animate-reveal-in" style={{ animationDelay: '1.5s' }}>PKR {Number(formData.budget).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="md:col-span-7 flex flex-col gap-md opacity-0 animate-reveal-up" style={{ animationDelay: '0.6s' }}>
                  <div className="bg-surface-container-low/70 backdrop-blur-xl border border-outline/30 rounded-sm p-lg relative h-full">
                    <h2 className="font-h2 text-h2 text-on-surface uppercase tracking-widest mb-lg border-b border-outline/10 pb-xs">Execution Timeline</h2>
                    <div className="relative border-l border-outline/30 ml-[11px] space-y-xl pb-md">
                      {plan.timeline && plan.timeline.map((step, idx) => (
                        <div key={idx} className="relative pl-lg group animate-reveal-up" style={{ animationDelay: `${0.7 + idx * 0.1}s` }}>
                          <div className={`absolute w-[23px] h-[23px] bg-background border rounded-full left-[-12px] top-0 flex items-center justify-center transition-all duration-500 ${idx === 0 ? 'border-primary shadow-[0_0_10px_rgba(233,193,118,0.3)]' : 'border-outline group-hover:border-primary/50'}`}>
                            {idx === 0 && <div className="w-[9px] h-[9px] bg-primary rounded-full animate-pulse"></div>}
                          </div>
                          <div className={`font-eyebrow text-[10px] uppercase tracking-widest mb-xs transition-colors duration-500 ${idx === 0 ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary/70'}`}>PHASE 0{idx + 1}</div>
                          <h3 className="font-body text-body text-on-surface mb-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-500">{step.split(':')[0] || step}</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">{step.split(':')[1] || step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center mt-xl border-t border-outline/20 pt-lg gap-md opacity-0 animate-reveal-up" style={{ animationDelay: '1.2s' }}>
                <button onClick={() => { setStep(1); setPlan(null); }} className="w-full md:w-auto px-lg py-sm border border-outline text-on-surface font-eyebrow text-[10px] uppercase tracking-[0.2em] rounded-sm hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all">
                  Start Over
                </button>
                <button onClick={handleCreateEvent} className="w-full md:w-auto px-lg py-sm bg-primary text-on-primary font-eyebrow text-[10px] uppercase tracking-[0.2em] rounded-sm hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-sm shadow-2xl group">
                  Find My Vendors <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl border-t border-outline/10 bg-background mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-md md:px-xl max-w-container-max mx-auto gap-md">
          <span className="font-eyebrow text-[10px] uppercase tracking-widest text-on-surface-variant">© KAIROS 2024</span>
          <div className="flex gap-md">
            <a className="font-eyebrow text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-eyebrow text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
            <a className="font-eyebrow text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventPlanningPage;
