"use client"
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('./components/map/map'), {
  ssr: false
});

export default function Home() {
  return (
        <>
          <h1> BEGINNING</h1>
          <Map />
        </>
  )
}