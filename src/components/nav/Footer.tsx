import Link from 'next/link';

export default function Footer()
{
  return (
    <footer id="contact" className="bg-[#0B2E65] text-white pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo/Brand Column */}
          <div className="md:col-span-1">
            <img src="/images/Logo 4.png" alt="Star4ce" className="h-12 mb-4" />
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              Better Hires. Fewer Exits.
            </p>
            <div className="flex gap-4">
              <a href="#" className="flex items-center justify-center hover:opacity-80 transition-opacity">
                <img src="/images/facebook.png" alt="Facebook" className="w-6 h-6 object-contain" />
              </a>
              <a href="#" className="flex items-center justify-center hover:opacity-80 transition-opacity">
                <img src="/images/insta.png" alt="Instagram" className="w-6 h-6 object-contain" />
              </a>
              <a href="#" className="flex items-center justify-center hover:opacity-80 transition-opacity">
                <img src="/images/x.png" alt="X (Twitter)" className="w-6 h-6 object-contain" />
              </a>
              <a href="#" className="flex items-center justify-center hover:opacity-80 transition-opacity">
                <img src="/images/tiktok.png" alt="TikTok" className="w-6 h-6 object-contain" />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Services</h3>
            <ul className="list-none p-0 m-0 space-y-3">
              <li>
                <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm">
                  Employee Retention
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm">
                  Workplace Analytics
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm">
                  Team Productivity
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm">
                  Hiring Solutions
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm">
                  Performance Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Company</h3>
            <ul className="list-none p-0 m-0 space-y-3">
              <li>
                <Link href="/about" className="text-white/80 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-white transition-colors text-sm">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="#surveys" className="text-white/80 hover:text-white transition-colors text-sm">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-white/80 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-white/80 hover:text-white transition-colors text-sm">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info Column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
            <div className="space-y-3 text-white text-sm">
              <p className="flex items-start gap-2">
                <span className="text-white">📧</span>
                <a href="mailto:info@starace.com" className="text-white hover:text-white/90 transition-colors">
                  info@starace.com
                </a>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-white">📞</span>
                <a href="tel:+15551234567" className="text-white hover:text-white/90 transition-colors">
                  (555) 123-4567
                </a>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-white">📍</span>
                <span className="text-white">
                  123 Business Ave<br />
                  Suite 100<br />
                  Los Angeles, CA 90210
                </span>
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <a href="/privacy" className="text-white/80 hover:text-white transition-colors text-sm block">
                Privacy Policy
              </a>
              <a href="/terms" className="text-white/80 hover:text-white transition-colors text-sm block">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-6 mt-8">
          <div className="text-center">
            <p className="text-white text-sm">&copy; {new Date().getFullYear()} Star4ce. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
