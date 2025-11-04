export default function WhyChoose() {
  const benefits = [
    {
      icon: '/images/deep.png',
      title: 'Deep Industry Expertise',
      description: 'Specialized knowledge of automotive retail operations and dealership-specific challenges.',
    },
    {
      icon: '/images/insights.png',
      title: 'Actionable Insights',
      description: 'Transform workforce data into clear, implementable strategies that drive real results.',
    },
    {
      icon: '/images/cost.png',
      title: 'Cost Efficiency',
      description: "Reduce hiring costs and turnover expenses while maximizing your team's potential.",
    },
    {
      icon: '/images/excellence.png',
      title: 'Managerial Excellence',
      description: 'Develop strong leadership capabilities that inspire teams and drive performance.',
    },
    {
      icon: '/images/analysis.png',
      title: 'Comprehensive Analysis',
      description: 'Thorough workforce assessments that identify opportunities and solutions.',
    },
    {
      icon: '/images/employment.png',
      title: 'Employee Engagement',
      description: 'Innovative strategies that create fulfilling work environments and boost satisfaction.',
    },
  ];

  return (
    <section className="bg-[#C7CBD3] py-16">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-4">WHY DEALERSHIPS CHOOSE US</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your dealership&apos;s success starts with understanding your people. Discover solutions to help your automotive retail professionals shine, sell better and find fulfillment in their work.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-6"
            >
              <div className="flex-shrink-0">
                <img 
                  src={benefit.icon} 
                  alt={benefit.title} 
                  className="w-14 h-14 object-contain" 
                  style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(96%) saturate(1000%) hue-rotate(207deg) brightness(95%) contrast(95%)' }}
                />
              </div>
              <div>
                <h3 className="text-[#0B2E65] mb-3 text-lg font-bold">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

