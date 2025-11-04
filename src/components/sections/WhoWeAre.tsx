export default function WhoWeAre() {
  const features = [
    {
      icon: '/images/people.png',
      title: 'People-first',
      description: 'We help you understand your employees beyond the numbers.',
    },
    {
      icon: '/images/data driven.png',
      title: 'Data-Driven',
      description: 'Actionable insights, not just forms and surveys.',
    },
    {
      icon: '/images/automotive focused.png',
      title: 'Automotive-Focused',
      description: "We understand dealership culture because we've lived it.",
    },
  ];

  return (
    <section id="about" className="bg-[#2c5aa0] text-white py-12 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="pr-0 md:pr-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">WHO WE ARE</h2>
            <p className="text-lg leading-relaxed text-white/90 mb-6">
              Star4ce is an HR platform built for car dealerships. With decades of industry experience, we help teams improve retention, culture, and performance through actionable employee insights.
            </p>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start p-3"
                >
                  <div className="flex items-center justify-center mr-4 flex-shrink-0">
                    <img src={feature.icon} alt={feature.title} className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-white/80 m-0">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden">
            <img 
              src="/images/Landingpage image 2.png" 
              alt="Expert Team" 
              className="w-full h-[350px] md:h-[400px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

