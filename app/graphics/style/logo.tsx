//@/(controller)/outer/logo.tsx
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export function AcmeLogo() {
  return (
    <div className="flex items-center gap-x-2">
      <GlobeAltIcon className="h-12 w-12 text-blue-500" />
      <p className="text-[1.5rem] font-bold text-gray-900">Acme</p>
    </div>
  );
}
