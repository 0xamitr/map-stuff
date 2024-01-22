"use client"
import disputed from './dispute.json';
import { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () =>{
  const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]
  const geoJsonStyle = {
    fillColor: 'transparent',
    color: 'lightgrey',
    weight: 2,
  };

  const [jsonObject, setJsonObject] = useState([]);
  return (
          <MapContainer style={{height:"60vh"}}center={DEFAULT_CENTER} zoom={4} minZoom={4}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
              <GeoJSON key='disputed-geojson' data={disputed as any} style={geoJsonStyle}/>
              {jsonObject.map((element, index)=>(   
                <GeoJSON key='disputed-geojson' data={element} style={geoJsonStyle}/>
              ))}
          </MapContainer>
        )
}

export default Map;