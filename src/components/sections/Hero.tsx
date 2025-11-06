'use client';
import Link from 'next/link';

export default function Hero() {
  return (
    <section 
      className="text-white py-[180px] md:py-[120px] text-center relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-[1px] z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />
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

