'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/solved');
  }, [router]);
  return null;
}
