import Image from "next/image";

export default function ReasonsSection() {
  return (
    <section className="bg-[#E6E6E6] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-12">
          Reasons for High Turnover
        </h2>

        <div className="space-y-10">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0B2E65] mb-4">
              1. Volatile Economic Conditions & External Disruptions
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-[#0B2E65] ml-4 text-base leading-relaxed">
              <li>COVID-19 furloughs and terminations created unprecedented instability</li>
              <li>Supply chain issues led to inventory shortages, affecting sales roles</li>
              <li>Economic uncertainty made employees seek more stable employment</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0B2E65] mb-4">
              2. Income Is Variable / Pay Structures Add Stress
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-[#0B2E65] ml-4 text-base leading-relaxed">
              <li>Commission-based roles create financial uncertainty</li>
              <li>Fluctuating earnings due to inventory or demand shifts</li>
              <li>Unpredictable compensation makes long-term planning difficult</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0B2E65] mb-4">
              3. Long & Unpredictable Hours, Job Stress, and Burnout
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-[#0B2E65] ml-4 text-base leading-relaxed">
              <li>Weekend and evening work requirements</li>
              <li>High customer demands and pressure to meet sales targets</li>
              <li>Work-life balance challenges leading to burnout</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0B2E65] mb-4">
              4. Key Positions Endure Especially High Turnover
            </h3>
            <p className="text-[#0B2E65] mb-6 text-base leading-relaxed ml-4">
              Commission-based roles and fluctuating earnings create additional challenges for retention.
            </p>

            <div>
              <h4 className="text-lg md:text-xl font-bold text-[#0B2E65] mb-4">
                Annualized Turnover by Position: Luxury vs Non-Luxury Dealerships
              </h4>
              <Image
                src="/images/luxuryxnon.png"
                alt="Annualized Turnover by Position: Luxury vs Non-Luxury Dealerships"
                width={1000}
                height={600}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0B2E65] mb-4">
              5. Demographic & Structural Contributors
            </h3>
            <ul className="list-disc list-inside space-y-2.5 text-[#0B2E65] ml-4 text-base leading-relaxed">
              <li>Higher turnover for female employees (e.g., female sales consultants)</li>
              <li>Younger employees (Gen Z, Millennials) leave due to unclear career paths</li>
              <li>Unpredictable compensation and demanding hours drive away talent</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
