export default function AnnualizedLosses() {
  return (
    <section className="bg-[#C7CBD3] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-8">Annualized Losses</h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p className="text-lg md:text-xl">
            Given the overall turnover rate in 2020 was 40%, and dealerships employed ~1.06 million people, the industry likely lost billions of dollars annually just from turnover.
          </p>
          <p className="text-lg md:text-xl font-semibold bg-white/80 p-6 rounded-lg text-[#0B2E65]">
            If even 25% of the 500,000+ turnovers were sales consultants, at ~$50,000 each, that's $6+ billion lost per year in the U.S. alone.
          </p>
        </div>
      </div>
    </section>
  );
}

