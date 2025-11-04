export default function WhatWeDo() {
  return (
    <section id="services" className="py-12">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="pr-0 md:pr-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-4">WHAT WE DO</h2>
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              Star4ce helps dealerships uncover the root causes of their workforce challenges. Through employee surveys, improved interview processes, and in-depth performance data, we give teams the clarity they need to identify issues and take meaningful action. Star4ce is the tool that turns insight into progress.
            </p>
            <ul className="list-none p-0">
              {[
                'Boost Employee Retention',
                'Strengthen Workplace Culture',
                'Increase Team Productivity',
                'Empower Smarter Hiring Decisions',
              ].map((item, index) => (
                <li key={index} className="flex items-center mb-3 font-medium text-[#0B2E65]">
                  <span className="text-[#0B2E65] font-bold mr-4 text-xl">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden">
            <img 
              src="/images/Landingpage Image 1.png" 
              alt="Team Collaboration" 
              className="w-full h-[350px] md:h-[400px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

