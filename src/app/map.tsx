import { useEffect } from 'react';
import Leaflet from 'leaflet';
import * as ReactLeaflet from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import styles from './Map.module.scss';

const { MapContainer } = ReactLeaflet;

const Map = ({ children, className, width, height, ...rest }: any) => {
  let mapClassName = styles.map;

  if ( className ) {
    mapClassName = `${mapClassName} ${className}`;
  }

  return (
    <MapContainer className={mapClassName} {...rest}>
      {children(ReactLeaflet, Leaflet)}
    </MapContainer>
  )
}

export default Map;
