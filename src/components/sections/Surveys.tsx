'use client';

export default function Surveys() {
  const surveys = [
    { name: 'Q4 Report', image: '/images/q4.jpg' },
    { name: 'Retention Study', image: '/images/retention.jpg' },
    { name: 'Engagement Metrics', image: '/images/engagement.jpg' },
    { name: 'Industry Trends', image: '/images/industry.jpg' },
    { name: 'Best Practices', image: '/images/practices.jpg' },
    { name: 'Salary Survey', image: '/images/salary.jpg' },
  ];

  return (
    <section id="surveys" className="bg-white py-20 relative">
      <div className="max-w-[1200px] mx-auto px-5 relative z-10">
        <h3 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-2 text-center">OUR SURVEYS</h3>
        <p className="text-center text-gray-600 mb-12 text-base">We Reach Out to Every Corner of Your Workforce</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
          {surveys.map((survey, index) => (
            <div key={index} className="survey-item bg-transparent rounded-lg overflow-hidden shadow-lg">
              <div className="w-full h-[120px] bg-[#C4C4C4] mb-0 overflow-hidden relative">
                <img 
                  src={survey.image} 
                  alt={survey.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gray background if image doesn't exist
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div 
                  className="absolute inset-0 bg-[#0B2E65]/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(11, 46, 101, 0.2) 0%, rgba(11, 46, 101, 0.1) 100%)',
                  }}
                ></div>
              </div>
              <div className="w-full h-10 bg-gray-700 flex items-center justify-center">
                <h4 className="text-white text-sm font-bold m-0">{survey.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

