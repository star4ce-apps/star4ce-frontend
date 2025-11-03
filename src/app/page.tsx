export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 leading-tight">
        Better Hires. <span className="text-slate-900">Fewer Exits.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Star4ce equips leaders with the data and training to build—and retain—top talent.
      </p>
      <div className="mt-8 flex gap-3">
        <a href="/pricing" className="bg-blue-700 text-white px-5 py-2.5 rounded-md">Book Now</a>
        <a href="/choose-star4ce" className="px-5 py-2.5 rounded-md border">Learn More</a>
      </div>
    </section>
  );
}
