export default function FounderCEO() {
  return (
    <section className="bg-[#C7CBD3] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="flex justify-center">
            <img 
              src="/images/MAtt Seamark.jpg" 
              alt="Matt Seamark, Founder &amp; CEO" 
              className="w-64 h-64 rounded-full object-cover"
            />
          </div>

          {/* Text Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-6">
              Our Founder &amp; CEO of Star4ce
            </h2>
            <div className="space-y-4 text-[#0B2E65] leading-relaxed">
              <p>
                With over 30 years in the automotive industry, Matt Seamark brings unmatched expertise in sales, leadership, and dealership operations. As the founder of Smart4ce, the nation&rsquo;s top automotive recruiting firm, he&rsquo;s helped dealerships find top performing talent across all departments.
              </p>
              <p>
                Now with Star4ce, Matt is focused on solving one of the industry&rsquo;s biggest challenges &mdash; <strong>employee turnover</strong>. He aims to empower dealerships with tools and insights that streamline hiring, improve retention, and build stronger teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
