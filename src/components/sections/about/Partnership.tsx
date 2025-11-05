export default function Partnership() {
  return (
    <section className="bg-[#E6E6E6] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-[#0B2E65]">In Partnership with</h2>
          <img 
            src="/images/smart4ce.png" 
            alt="Smart4ce Logo" 
            className="h-12 md:h-14 w-auto"
          />
        </div>

        <div className="max-w-3xl space-y-4 text-[#0B2E65] leading-relaxed mb-8">
          <p>
            The nation&rsquo;s leading automotive recruiting company, founded to help dealerships find, hire, and retain top-performing talent across departments. With over 30 years of industry experience, Smart4ce connects high-performing candidates with roles in sales, service, finance, and more.
          </p>
          <p>
            Their team brings unmatched recruiting insight and dealership knowledge, helping both employers and job seekers create long-term, high-value matches that drive dealership growth and success.
          </p>
        </div>

        <div>
          <a
            href="https://www.smart4ce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0B2E65] text-white px-8 py-3 rounded-md font-bold hover:bg-[#2c5aa0] transition-colors"
          >
            Visit Smart4ce
          </a>
        </div>
      </div>
    </section>
  );
}
