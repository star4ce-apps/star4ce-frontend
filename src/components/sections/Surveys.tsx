export default function Surveys() {
  const surveys = [
    'Q4 Report',
    'Retention Study',
    'Engagement Metrics',
    'Industry Trends',
    'Best Practices',
    'Salary Survey',
  ];

  return (
    <section id="surveys" className="bg-[#E6E6E6] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <h3 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-2 text-center">OUR SURVEYS</h3>
        <p className="text-center text-gray-600 mb-12 text-base">We Reach Out to Every Corner of Your Workforce</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
          {surveys.map((survey, index) => (
            <div key={index} className="survey-item bg-transparent rounded-lg overflow-hidden transition-transform hover:-translate-y-1">
              <div className="w-full h-[120px] bg-[#C4C4C4] mb-0"></div>
              <div className="w-full h-10 bg-[#8D8D8D] flex items-center justify-center">
                <h4 className="text-white text-sm font-bold m-0">{survey}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

