import dynamic from 'next/dynamic';
import dbConnect from './lib/dbConnect'

const MapContainer = dynamic(() => import('./mapcontainer'), {
  ssr: false // Ensure MapContainer is client-side
});
export default async function Home() {
  await dbConnect(); 
  return (
        <>
          <MapContainer />
        </>
  )
}