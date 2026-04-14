import Link from 'next/link';
import Logo from '@/components/Logo';

export default function RegistrationClosed() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <Logo size="md" className="mb-6" />
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Registration is closed</h1>
        <p className="text-gray-600 text-sm mb-6">
          We are not accepting new accounts right now. You can still browse the site, or sign in if you already have an account.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/" className="text-[#0B2E65] hover:underline font-medium">
            Return home
          </Link>
          <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
