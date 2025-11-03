export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Star4ce. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/about" className="hover:text-blue-700">About</a>
          <a href="/case-studies" className="hover:text-blue-700">Case Studies</a>
          <a href="/pricing" className="hover:text-blue-700">Pricing</a>
          <a href="/login" className="hover:text-blue-700">Login</a>
        </div>
      </div>
    </footer>
  );
}
