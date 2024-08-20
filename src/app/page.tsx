"use client"
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';  // Import Leaflet CSS globally

const Map = dynamic(() => import('./components/map'), {
  ssr: false // This ensures that the component is only rendered on the client side
});

export default function Home() {
  return (
        <>
          <h1> BEGINNING</h1>
          <Map />
        </>
  )
}