'use client';

export default function Trusted() {
  const logos = [
    'AutoMax',
    'Premier Motors',
    'CarHub Elite',
    'Elite Auto Group',
    'ProAuto Solutions',
    'Metro Dealerships',
    'Summit Auto',
  ];

  // Duplicate for seamless loop
  const allLogos = [...logos, ...logos];

  return (
    <section className="bg-[#D9D9D9] py-10 text-center overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-2xl font-bold text-[#0B2E65] mb-6">Trusted by Top Dealerships</h2>
        <div className="relative overflow-hidden">
          <div 
            className="flex gap-12 carousel-track"
            style={{
              width: 'calc(200% + 6rem)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running';
            }}
          >
            {allLogos.map((logo, index) => (
              <div
                key={index}
                className="min-w-[150px] h-20 bg-white rounded-lg flex items-center justify-center text-gray-600 font-bold shadow-md hover:scale-105 transition-transform"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

