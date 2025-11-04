export default function MissionVision() {
  const missionItems = [
    "Help automotive dealerships make smarter, data-driven hiring decisions",
    "Reduce turnover by identifying patterns and root causes",
    "Empower hiring managers with structured tools and training",
    "Simplify how surveys, interviews, and candidate evaluations are handled",
  ];

  const visionItems = [
    "Set a new standard for automotive recruitment using technology",
    "Build a connected platform that helps dealers retain top talent",
    "Become the most trusted tool for dealership hiring and retention",
    "Foster long-term growth by matching the right people with the right roles",
  ];

  return (
    <section className="bg-[#0B2E65] text-white py-20 relative mission-vision-section">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Our Mission */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Mission</h2>
            <ul className="space-y-4">
              {missionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-white text-xl mr-3">★</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-white/30"></div>

          {/* Our Vision */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Vision</h2>
            <ul className="space-y-4">
              {visionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-white text-xl mr-3">★</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

