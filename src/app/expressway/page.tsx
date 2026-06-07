import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const MapContainer = nextDynamic(() => import('../mapcontainer'), { ssr: false });

export default function Page() {
  return <MapContainer />;
}