import React, { useState } from 'react';
import { useAuth } from '../App';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { email, password, full_name: name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please verify the backend is running.');
      }
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      login(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary overflow-hidden">
      <main className="flex-grow flex w-full h-screen">
        {/* Left Side: Visual */}
        <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden bg-surface-container-low border-r border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background z-10 opacity-40"></div>
          <div className="absolute inset-0 z-0">
            <img 
              alt="Abstract luxury visual" 
              className="w-full h-full object-cover object-center absolute inset-0 grayscale contrast-125 brightness-75 animate-slow-zoom" 
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop" 
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] z-20"></div>
          
          {/* Subtle branding on image */}
          <div className="absolute bottom-xl left-xl z-30 animate-reveal-up" style={{ animationDelay: '0.8s' }}>
            <span className="font-eyebrow text-eyebrow text-white/40 uppercase tracking-[0.5em]">Est. 2024</span>
          </div>
          
          {/* Decorative line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent z-30 opacity-50"></div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-md lg:px-xl relative bg-background overflow-y-auto">
          <div className="w-full max-w-md mx-auto flex flex-col gap-xl py-12">
            
            {/* Header */}
            <div className="flex flex-col gap-md text-center lg:text-left animate-reveal-up">
              <div className="flex flex-col items-center lg:items-start">
                <img src="/logo.png" alt="KAIROS" className="h-16 w-auto object-contain mb-4 brightness-110 contrast-125" />
                <span className="font-eyebrow text-[10px] text-primary uppercase tracking-[0.3em] mb-2 block">Premium Event Orchestration</span>
                <h2 className="font-h1 text-h1 font-light tracking-[0.3em] text-on-surface uppercase mb-1">KAIROS</h2>
                <div className="h-px w-12 bg-primary/40 mx-auto lg:mx-0"></div>
              </div>

              <h1 className="font-h2 text-h2 text-on-surface/90 mt-4 leading-tight">
                {isLogin ? 'Access the Atelier' : 'Join the Collective'}
              </h1>
            </div>

            {/* Toggle */}
            <div className="flex w-full border-b border-white/5 animate-reveal-up" style={{ animationDelay: '0.1s' }}>
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 pb-4 font-eyebrow text-eyebrow uppercase transition-all duration-500 relative ${isLogin ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Login
                {isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-reveal-in"></div>}
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 pb-4 font-eyebrow text-eyebrow uppercase transition-all duration-500 relative ${!isLogin ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Register
                {!isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-reveal-in"></div>}
              </button>
            </div>

            {error && (
              <div className="bg-error/5 border border-error/20 text-error p-4 text-xs uppercase tracking-widest animate-reveal-in">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full animate-reveal-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col gap-6">
                {!isLogin && (
                  <div className="relative group">
                    <label className={`font-eyebrow text-[10px] uppercase tracking-widest text-primary/60 absolute left-0 transition-all duration-500 ${name ? '-top-4 opacity-100' : 'top-2 opacity-0'}`} htmlFor="name">Full Name</label>
                    <input 
                      className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 font-body text-body text-on-surface focus:ring-0 focus:border-primary transition-all duration-500 pt-4 placeholder:text-on-surface-variant/30" 
                      id="name" 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={!name ? "Full Name" : ""}
                      required={!isLogin}
                    />
                  </div>
                )}
                <div className="relative group">
                  <label className={`font-eyebrow text-[10px] uppercase tracking-widest text-primary/60 absolute left-0 transition-all duration-500 ${email ? '-top-4 opacity-100' : 'top-2 opacity-0'}`} htmlFor="email">Email Address</label>
                  <input 
                    className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 font-body text-body text-on-surface focus:ring-0 focus:border-primary transition-all duration-500 pt-4 placeholder:text-on-surface-variant/30" 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={!email ? "Email Address" : ""}
                    required 
                  />
                </div>
                <div className="relative group">
                  <label className={`font-eyebrow text-[10px] uppercase tracking-widest text-primary/60 absolute left-0 transition-all duration-500 ${password ? '-top-4 opacity-100' : 'top-2 opacity-0'}`} htmlFor="password">Password</label>
                  <input 
                    className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-2 font-body text-body text-on-surface focus:ring-0 focus:border-primary transition-all duration-500 pt-4 placeholder:text-on-surface-variant/30" 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={!password ? "Password" : ""}
                    required 
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-between items-center w-full animate-reveal-up" style={{ animationDelay: '0.3s' }}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input className="peer w-4 h-4 rounded-none bg-transparent border border-white/20 focus:ring-0 text-primary checked:bg-primary transition-all duration-300 appearance-none" type="checkbox" />
                      <span className="material-symbols-outlined absolute text-[12px] text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">check</span>
                    </div>
                    <span className="font-body-sm text-[12px] text-on-surface-variant group-hover:text-on-surface transition-colors uppercase tracking-wider">Remember me</span>
                  </label>
                  <a className="font-body-sm text-[12px] text-on-surface-variant hover:text-primary transition-all duration-300 uppercase tracking-wider underline decoration-white/10 hover:decoration-primary underline-offset-4" href="#">Forgot Password?</a>
                </div>
              )}

              {/* CTA */}
              <button 
                className="w-full py-4 px-8 bg-transparent border border-primary/50 text-primary font-eyebrow text-eyebrow uppercase tracking-[0.2em] hover:bg-primary hover:text-background transition-all duration-500 flex justify-center items-center gap-3 group relative overflow-hidden" 
                type="submit"
              >
                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10">{isLogin ? 'AUTHENTICATE' : 'CREATE ACCOUNT'}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform relative z-10">arrow_forward_ios</span>
              </button>
            </form>

            {/* Disclosure */}
            <div className="mt-8 pt-8 border-t border-white/5 text-center animate-reveal-up" style={{ animationDelay: '0.4s' }}>
              <p className="font-eyebrow text-[10px] text-primary/40 uppercase tracking-[0.3em] mb-6">Demo Credentials</p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setEmail('demo@kairos.com');
                    setPassword('demo123');
                    setIsLogin(true);
                    setTimeout(() => {
                      const loginBtn = document.querySelector('button[type="submit"]');
                      if (loginBtn) loginBtn.click();
                    }, 100);
                  }}
                  className="group flex flex-col items-center"
                >
                  <span className="font-body-sm text-[11px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">Customer Access</span>
                  <span className="text-[10px] text-white/20 mt-1">demo@kairos.com / demo123</span>
                  <div className="h-px w-0 group-hover:w-full bg-primary/30 transition-all duration-500 mt-1"></div>
                </button>
                <button 
                  onClick={() => {
                    setEmail('admin@kairos.com');
                    setPassword('admin123');
                    setIsLogin(true);
                    setTimeout(() => {
                      const loginBtn = document.querySelector('button[type="submit"]');
                      if (loginBtn) loginBtn.click();
                    }, 100);
                  }}
                  className="group flex flex-col items-center"
                >
                  <span className="font-body-sm text-[11px] text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-widest">Concierge Access</span>
                  <span className="text-[10px] text-white/20 mt-1">admin@kairos.com / admin123</span>
                  <div className="h-px w-0 group-hover:w-full bg-primary/30 transition-all duration-500 mt-1"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

  );
};

export default AuthPage;
