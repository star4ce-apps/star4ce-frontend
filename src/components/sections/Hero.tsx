'use client';
import Link from 'next/link';

export default function Hero() {
  return (
    <section 
      className="text-white py-[180px] md:py-[120px] text-center relative overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(11, 46, 101, 0.6) 0%, rgba(11, 46, 101, 0.5) 100%), url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="max-w-[1200px] mx-auto px-5 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            BETTER HIRES.<br />FEWER EXITS.
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white max-w-[600px] mx-auto">
            Get your people analytics right the first time and maximize 3X dealership productivity faster than ever before. We are experts.
          </p>
          <Link
            href="/survey"
            className="inline-block bg-[#e74c3c] text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#c0392b] transition-colors"
          >
            Take Survey
          </Link>
        </div>
      </div>
    </section>
  );
}

