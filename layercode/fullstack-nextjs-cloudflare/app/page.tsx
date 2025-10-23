'use client';
import dynamic from 'next/dynamic';

// Dynamically import the VoiceAgent component with SSR disabled
const VoiceAgent = dynamic(() => import('./ui/VoiceAgent'), { ssr: false });

export default function Home() {
  return <VoiceAgent />;
}
