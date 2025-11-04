export default function Blogs() {
  const blogs = [
    'Hiring Tips',
    'Team Building',
    'Performance Guide',
  ];

  return (
    <section id="blogs" className="bg-[#C7CBD3] py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <h3 className="text-3xl md:text-4xl font-bold text-[#0B2E65] mb-2 text-center">OUR BLOGS</h3>
        <p className="text-center text-gray-600 mb-12 text-base">View our recent stories and blog posts</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
          {blogs.map((blog, index) => (
            <div key={index} className="blog-item bg-transparent rounded-lg overflow-hidden transition-transform hover:-translate-y-1">
              <div className="w-full h-[140px] bg-[#C4C4C4] mb-0"></div>
              <div className="w-full h-10 bg-[#8D8D8D] flex items-center justify-center">
                <h4 className="text-white text-sm font-bold m-0">{blog}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

