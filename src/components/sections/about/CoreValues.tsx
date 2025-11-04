export default function CoreValues() {
  const values = [
    {
      icon: '/images/integrity.png',
      title: 'Integrity in Every Hire',
      description: 'We believe in honest, transparent, and ethical recruiting that puts people first.',
    },
    {
      icon: '/images/datadriven.png',
      title: 'Data-Driven Insight',
      description: 'Every decision we make is backed by analytics, patterns, and performance metrics.',
    },
    {
      icon: '/images/partnership.png',
      title: 'Partnership with Purpose',
      description: 'We foster strong, long-term relationships between dealerships and talent.',
    },
    {
      icon: '/images/expertise.png',
      title: 'Excellence Through Expertise',
      description: 'Our decades of automotive industry knowledge shape smarter hiring and retention.',
    },
    {
      icon: '/images/tools.png',
      title: 'Empowerment Through Tools',
      description: 'We equip dealerships with technology and strategies to build stronger teams.',
    },
    {
      icon: '/images/retention.png',
      title: 'Committed Retention',
      description: "We don't just help you hire - we help you keep your best talent, long-term.",
    },
  ];

  return (
    <section className="bg-[#E6E6E6] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-12">
          <p className="text-sm text-[#0B2E65] font-bold mb-2">CORE VALUES</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65]">
            The Values That Power Our People-First Platform
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white p-6 rounded-lg">
              <div className="mb-4">
                <img 
                  src={value.icon} 
                  alt={value.title} 
                  className="w-12 h-12 object-contain" 
                  style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(96%) saturate(1000%) hue-rotate(207deg) brightness(95%) contrast(95%)' }}
                />
              </div>
              <h3 className="text-xl font-bold text-[#0B2E65] mb-3">{value.title}</h3>
              <p className="text-[#0B2E65] leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

