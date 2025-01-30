// app/logout/page.tsx

'use client';  // Add this line at the top to mark the file as client-side

import { useState } from 'react';
import { MailOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Logout() {


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Button  >
        Send Request
      </Button>

      <Button asChild>
        <Link href="/signin">
          <span className="flex items-center gap-2">
            <MailOpen /> YOU ARE LOGGED OUT
          </span>
        </Link>
      </Button>


    </div>

  );
}
