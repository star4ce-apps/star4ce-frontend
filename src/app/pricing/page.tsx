'use client';
import Link from 'next/link';

export default function PricingPage() {
  const features = [
    'Candidate Management',
    'Subaccount Management',
    'Interview Management',
    'Dealer Dashboard & Reports',
    'Performance Reviews',
    'Candidate Score Card',
    'Employee Feedback Survey',
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        paddingTop: '140px', // Add padding to account for navbar
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="fixed inset-0 backdrop-blur-sm z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Pricing Modal */}
      <div className="relative z-10 w-full max-w-6xl mx-5 my-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-20 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Content */}
          <div className="bg-[#E6E6E6] flex-1 p-8 md:p-10 overflow-hidden">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0B2E65] mb-4">
                Choose a Plan
              </h1>
              <p className="text-gray-700 text-sm md:text-base max-w-2xl mx-auto">
                Our dealership membership gives you full access to powerful hiring and management tools that make building your team easier than ever.
              </p>
            </div>

            {/* Pricing Cards with Features in the Middle */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-6 items-stretch">
              {/* Dealer Flex Plan */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-xl hover:border-[#0B2E65]/30 transition-all duration-300 flex flex-col hover:-translate-y-1">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">Dealer Flex</h3>
                  <div className="mb-3">
                    <span className="text-5xl font-bold text-[#0B2E65]">$199</span>
                    <span className="text-gray-600 text-xl ml-1">/ month</span>
                  </div>
                  <p className="text-sm text-gray-600">billed monthly</p>
                </div>
                <div className="flex-grow mb-6">
                  <p className="text-gray-700 text-sm">Perfect for teams starting their hiring transformation journey</p>
                </div>
                <Link
                  href="/admin-register?plan=monthly"
                  className="block w-full bg-[#0B2E65] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-all hover:shadow-md hover:scale-[1.02]"
                >
                  Sign up
                </Link>
              </div>

              {/* Features Section - Middle Column */}
              <div className="p-4 flex flex-col">
                <div className="w-full bg-[#0B2E65] text-white py-2 rounded-lg font-semibold mb-4 text-center">
                  Features
                </div>
                <ul className="space-y-2 mx-auto">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#0B2E65] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dealer Success Plan */}
              <div className="bg-white rounded-xl border-2 border-[#e74c3c]/30 p-8 shadow-lg hover:shadow-xl hover:border-[#e74c3c]/50 transition-all duration-300 flex flex-col hover:-translate-y-1 relative">
                <div className="absolute top-0 right-0 bg-[#e74c3c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  BEST VALUE
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#e74c3c] mb-4">Dealer Success</h3>
                  <div className="mb-3">
                    <span className="text-5xl font-bold text-[#e74c3c]">$166</span>
                    <span className="text-gray-600 text-xl ml-1">/ month</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">billed yearly</p>
                  <p className="text-sm font-semibold text-[#e74c3c]">Save $365 per year!</p>
                </div>
                <div className="flex-grow mb-6">
                  <p className="text-gray-700 text-sm">Maximum savings for committed teams building long-term success</p>
                </div>
                <Link
                  href="/admin-register?plan=annual"
                  className="block w-full bg-[#0B2E65] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-all hover:shadow-md hover:scale-[1.02]"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
