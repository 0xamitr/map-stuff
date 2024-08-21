import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import indiaBoundaryLines from '../../../../public/dispute.json'
import styles from './map.module.css'

const BoundaryLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    const boundaryStyle = (feature) => {
      const weight = map.getZoom() / 4;
      return {
        color: feature.properties.boundary === 'disputed' ? '#f2efea' : '#b9a8b9',
        weight: feature.properties.boundary === 'disputed' ? weight * 2 : weight,
      };
    };

    const geoJsonLayer = L.geoJSON(data, {
      style: boundaryStyle,
    }).addTo(map);

    map.on('zoomend', () => {
      geoJsonLayer.eachLayer((layer) => {
        layer.setStyle(boundaryStyle(layer.feature));
      });
    });

    return () => {
      map.removeLayer(geoJsonLayer);
    };
  }, [map, data]);

  return null;
};

const MapComponent = () => {
  const bounds = [
    [-90, -180], // Southwest corner
    [90, 180]    // Northeast corner
  ];
  return (

    <MapContainer className={styles.map} center={[34, 80]} zoom={4} minZoom={3} maxBounds={bounds} maxBoundsViscosity={1.0}>
      <TileLayer
        noWrap={true}
        continuousWorld={false}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      />
      <BoundaryLayer data={indiaBoundaryLines} />
    </MapContainer>
  );
};

export default MapComponent;

