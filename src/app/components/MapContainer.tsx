"use client"
import Map from './Map';
import disputed from './dispute.json';

const DEFAULT_CENTER = [20.5937, 78.9629]
const MapContainer = () =>{
  const geoJsonStyle = {
    fillColor: 'transparent',
    color: 'grey',
    weight: 1,
  };
  return (
        <Map center={DEFAULT_CENTER} minZoom={4} zoom={4}>
        {({ TileLayer, GeoJSON, Popup }: any) => (
            <>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
            <GeoJSON key='disputed-geojson' data={disputed} style={geoJsonStyle}/>
            </>
        )}
        </Map>
  )
}

export default MapContainer;