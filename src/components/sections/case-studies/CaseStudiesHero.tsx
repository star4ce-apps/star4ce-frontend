import Image from "next/image";

export default function CaseStudiesHero() {
  return (
    <section className="bg-[#D9D9D9] pt-32 pb-16">
      <div className="max-w-[1200px] mx-auto px-5">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B2E65] leading-tight mb-12">
          Why Car Dealerships Experience the Highest Turnover Rate
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <div className="bg-white rounded-lg shadow-sm">
              <Image
                src="/images/turnoverrategraph.png"
                alt="Monthly Turnover Graph: 2019 vs 2020"
                width={600}
                height={400}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-start">
            <p className="text-gray-600 leading-relaxed text-sm md:text-base font-light">
              Drawing on insights from the 2021 NADA Dealership Workforce Study: National & Regional Trends in Compensation & Retention,
              several key factors explain why turnover remains high in franchised vehicle dealerships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
