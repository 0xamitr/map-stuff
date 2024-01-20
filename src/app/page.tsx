"use client"
import Map from './map1';


const DEFAULT_CENTER = [20.5937, 78.9629]

export default function Home() {
  return (
        <>
        <h1> BEGINNING</h1>
        <Map  width="800" height="400" center={DEFAULT_CENTER} zoom={4}>
        {({ TileLayer, Marker, Popup }: any) => (
            <>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
            </>
        )}
        </Map>
        </>
  )
}
