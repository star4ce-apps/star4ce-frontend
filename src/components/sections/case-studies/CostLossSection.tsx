export default function CostLossSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-12">Calculate Cost Loss from High Turnover</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              1. Recruiting & Hiring
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>Advertising costs</li>
              <li>Recruiter fees</li>
              <li>Background checks</li>
              <li>Interview time</li>
              <li className="font-semibold text-[#0B2E65] mt-3">Typical spend: $3,000-$5,000 per new hire</li>
            </ul>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              2. Onboarding & Training
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>Formal training requirements</li>
              <li>Industry average training cost: $7,500-$10,000 annually</li>
              <li className="font-semibold text-[#0B2E65] mt-3">Much of this investment is wasted if an employee leaves early</li>
            </ul>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              3. Lost Productivity
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>New hires take 3-6 months to ramp up</li>
              <li className="font-semibold text-[#0B2E65] mt-3">NADA estimates lost productivity can equal 25-50% of annual salary</li>
            </ul>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              4. Customer Experience & Satisfaction
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>High turnover disrupts customer relationships</li>
              <li className="font-semibold text-[#0B2E65] mt-3">Can reduce long-term gross profit by $50,000-$100,000 over their lifetime</li>
            </ul>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              5. Team Morale
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>Constantly replacing staff increases workload for remaining employees</li>
              <li>Leads to burnout and more turnover</li>
            </ul>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#0B2E65] mb-4">
              6. Inventory & Sales Impact
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-gray-700 ml-4 text-base leading-relaxed">
              <li>Lack of experienced sales consultants</li>
              <li className="font-semibold text-[#0B2E65] mt-3">Can lead to $300,000-$500,000 in lost annual vehicle sales revenue per unfilled sales role</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

