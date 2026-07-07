'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  message?: string[];
}

export default function ContactSection() {
  const [mediaData, setMediaData] = useState({
    card_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    showreel_url: "/videos/showreel.mp4"
  });

  useEffect(() => {
    fetch("/api/content/contact")
      .then(res => res.json())
      .then(data => {
        if (data && data.card_image_url && data.showreel_url) {
          setMediaData(data);
        }
      })
      .catch(err => console.error("Failed to fetch contact assets", err));
  }, []);
  const [isShowreelOpen, setIsShowreelOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');

  const [status, setStatus]             = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');
    setFieldErrors({});

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, company }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setStatus('error');
        setErrorMessage(data.error ?? "You're sending messages too quickly. Please wait a bit and try again.");
        return;
      }

      if (res.status === 400) {
        setStatus('error');
        setFieldErrors(data.errors ?? {});
        setErrorMessage('Please check the highlighted fields.');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setCompany('');
    } catch {
      setStatus('error');
      setErrorMessage('Could not reach the server. Please check your connection and try again.');
    }
  };

  const openShowreel = () => {
    setIsMuted(true);
    setIsShowreelOpen(true);
  };

  const closeShowreel = () => {
    setIsShowreelOpen(false);
    setIsMuted(true);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
      modalVideoRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  useEffect(() => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (isShowreelOpen && modalVideoRef.current) {
      modalVideoRef.current.play().catch(() => {});
    }
  }, [isShowreelOpen]);

  useEffect(() => {
    if (!isShowreelOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShowreel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isShowreelOpen]);

  useEffect(() => {
    if (!isShowreelOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isShowreelOpen]);

  return (
    <div className="relative w-full min-h-screen font-sans flex flex-col justify-between p-4 pt-16 sm:p-6 sm:pt-20 md:p-10 md:pt-24 overflow-hidden select-none" style={{ background: "var(--bg)", color: "var(--fg)" }}>

      <video
        className="absolute inset-0 w-full h-full object-cover opacity-70 z-0 pointer-events-none"
        src={mediaData.showreel_url}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

      <main className="w-full max-w-5xl bg-white text-black mx-auto my-auto p-4 sm:p-6 md:p-10 grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 relative z-10 shadow-2xl">

        <div className="md:col-span-2 relative min-h-[220px] sm:min-h-[300px] md:min-h-[450px] bg-black overflow-hidden">
          <Image
            src={mediaData.card_image_url}
            alt="Abstract Editorial Art"
            fill
            className="object-cover grayscale contrast-125 opacity-90 transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-3 flex flex-col justify-between gap-4 sm:gap-6">

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-3 sm:mb-4">Contact</h1>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-lg">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam,
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6">

            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
            >
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs md:text-sm font-medium">Your Name:</label>
              <input
                type="text"
                id="name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-black py-1 focus:outline-none text-sm font-light tracking-wide"
                autoComplete="off"
              />
              {fieldErrors.name && <span className="text-xs text-red-600">{fieldErrors.name[0]}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs md:text-sm font-medium">Your Email:</label>
                <input
                  type="email"
                  id="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-black py-1 focus:outline-none text-sm font-light tracking-wide"
                  autoComplete="off"
                />
                {fieldErrors.email && <span className="text-xs text-red-600">{fieldErrors.email[0]}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs md:text-sm font-medium">Your Phone Number:</label>
                <input
                  type="tel"
                  id="phone"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-b border-black py-1 focus:outline-none text-sm font-light tracking-wide"
                  autoComplete="off"
                />
                {fieldErrors.phone && <span className="text-xs text-red-600">{fieldErrors.phone[0]}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs md:text-sm font-medium">Your Message:</label>
              <input
                type="text"
                id="message"
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border-b border-black py-1 focus:outline-none text-sm font-light tracking-wide"
                autoComplete="off"
              />
              {fieldErrors.message && <span className="text-xs text-red-600">{fieldErrors.message[0]}</span>}
            </div>

          </div>

          {status === 'success' && (
            <p className="text-sm text-green-700">Message sent! We&apos;ll be in touch soon.</p>
          )}
          {status === 'error' && errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <div className="flex justify-end mt-2 sm:mt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full sm:w-auto bg-black text-white text-xs md:text-sm font-medium uppercase tracking-widest py-3 px-8 rounded-full transition-all duration-300 hover:bg-neutral-800 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Sending…' : "Let's Talk"}
            </button>
          </div>

        </form>
      </main>

      <footer className="w-full text-center z-10 pt-4">
        <button
          type="button"
          onClick={openShowreel}
          className="text-[10px] md:text-xs font-semibold tracking-[0.6em] uppercase text-white cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none"
        >
          View Showreel
        </button>
      </footer>

      {isShowreelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-4 md:p-10"
          onClick={closeShowreel}
        >
          <div
            className="relative w-full h-full sm:h-auto sm:max-w-5xl sm:aspect-video bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={modalVideoRef}
              className="w-full h-full object-cover sm:object-contain"
              src={mediaData.showreel_url}
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
            <button
              type="button"
              onClick={closeShowreel}
              aria-label="Close showreel"
              className="absolute top-8 left-4 sm:left-auto sm:right-4 sm:top-4 md:top-4 md:right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-lg hover:bg-neutral-200 transition-colors z-10"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-6 right-4 sm:bottom-4 sm:right-4 bg-white/90 text-black text-xs font-medium uppercase tracking-widest py-2 px-4 rounded-full hover:bg-white transition-colors z-10"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}