'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Testimonial() {
  return (
    <section className="bg-[#E6E6E6] py-16">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-bold text-[#0B2E65]">Welcome to</span>
              <div className="text-3xl md:text-4xl font-bold">
                <span className="text-[#0B2E65]">Star</span>
                <span className="text-red-600">4</span>
                <span className="text-[#0B2E65]">ce</span>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Discover how Star4ce transforms dealership operations through data-driven insights and employee engagement. Our platform helps you make smarter hiring decisions, reduce turnover, and build stronger teams.
            </p>
            <Link
              href="/pricing"
              className="inline-block cursor-pointer bg-[#0B2E65] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#2c5aa0] transition-colors"
            >
              Explore Plans
            </Link>
          </div>

          {/* Right Side - Video */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
            <video
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl"
              src="/videos/intro.mp4"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              style={{ objectFit: 'cover' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
