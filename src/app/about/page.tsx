'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/#about');
  }, [router]);

  return null;
}
