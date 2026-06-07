"use client"

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import indiaBoundaryLines from '../../../../public/dispute.json';
import styles from './map.module.css';

const STATUS_THEME = {
  completed: {
    color: '#1f7a4d',
    fillColor: '#2da66b',
    dashArray: null,
    label: 'Completed',
  },
  'u/c': {
    color: '#c46b1e',
    fillColor: '#f59e0b',
    dashArray: '8 6',
    label: 'Under construction',
  },
  proposed: {
    color: '#2b67d1',
    fillColor: '#60a5fa',
    dashArray: '3 6',
    label: 'Proposed',
  },
  default: {
    color: '#334155',
    fillColor: '#64748b',
    dashArray: null,
    label: 'Other',
  },
};

const getStatusToken = (project) => {
  const raw = String(project?.status || '').toLowerCase().trim();
  if (raw === 'completed') return 'completed';
  if (raw === 'u/c' || raw === 'uc' || raw.includes('under')) return 'u/c';
  if (raw === 'proposed') return 'proposed';
  return 'default';
};

const getLayerLabel = (project) => project?.name || project?.geojson?.properties?.name || 'Untitled project';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getRoadWeight = (zoom) => clamp(0.9 + (zoom - 4) * 0.7, 1.4, 8);

const getHoverWeight = (zoom) => clamp(getRoadWeight(zoom) + 1.8, 2.6, 10);

const getBoundaryWeight = (zoom) => clamp(0.55 + (zoom - 4) * 0.22, 0.8, 2.8);

const toFeatureCollection = (mapdata) => {
  const features = [];

  mapdata.forEach((project) => {
    if (!project?.geojson) return;

    const attachProject = (feature) => ({
      ...feature,
      properties: {
        ...(feature?.properties || {}),
        __project: project,
      },
    });

    if (project.geojson.type === 'FeatureCollection' && Array.isArray(project.geojson.features)) {
      project.geojson.features.forEach((feature) => {
        features.push(attachProject(feature));
      });
      return;
    }

    features.push(attachProject(project.geojson));
  });

  return {
    type: 'FeatureCollection',
    features,
  };
};

const BoundaryLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    const boundaryStyle = (feature) => {
      const weight = getBoundaryWeight(map.getZoom());

      return {
        color:
          feature.properties.boundary === 'disputed'
            ? '#f5efe8'
            : '#b7a5b4',
        opacity: feature.properties.boundary === 'disputed' ? 0.9 : 0.6,
        fillOpacity: 0,
        weight:
          feature.properties.boundary === 'disputed'
            ? weight * 2
            : weight,
        lineCap: 'round',
        lineJoin: 'round',
      };
    };

    const geoJsonLayer = L.geoJSON(data, {
      style: boundaryStyle,
      renderer: L.canvas(),
    }).addTo(map);

    const handleZoom = () => {
      geoJsonLayer.eachLayer((layer) => {
        layer.setStyle(boundaryStyle(layer.feature));
      });
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
      map.removeLayer(geoJsonLayer);
    };
  }, [map, data]);

  return null;
};

const RoadLayer = ({ mapdata }) => {
  const map = useMap();

  useEffect(() => {
    if (!mapdata?.length) return;

    const combinedGeojson = toFeatureCollection(mapdata);

    const getStyle = (project) => {
      const status = getStatusToken(project);
      const theme = STATUS_THEME[status] || STATUS_THEME.default;
      const weight = getRoadWeight(map.getZoom());

      return {
        color: theme.color,
        opacity: 0.95,
        weight,
        dashArray: theme.dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      };
    };

    const highlightLayer = (layer) => {
      layer.setStyle({
        weight: getHoverWeight(map.getZoom()),
        opacity: 1,
      });
      if (layer.bringToFront) layer.bringToFront();
    };

    const resetLayer = (layer, project) => {
      layer.setStyle(getStyle(project));
    };

    const geoJsonLayer = L.geoJSON(combinedGeojson, {
      renderer: L.canvas(),
      style: (feature) => getStyle(feature?.properties?.__project),
      onEachFeature: (feature, leafletLayer) => {
        const project = feature?.properties?.__project;
        if (!project) return;

        const status = getStatusToken(project);
        const theme = STATUS_THEME[status] || STATUS_THEME.default;
        const title = getLayerLabel(project);

        leafletLayer.bindTooltip(
          `<div class="${styles.tooltipTitle}">${title}</div><div class="${styles.tooltipMeta}">${theme.label}</div>`,
          {
            sticky: true,
            direction: 'auto',
            opacity: 0.96,
            className: styles.tooltip,
          }
        );

        leafletLayer.on({
          mouseover: () => highlightLayer(leafletLayer),
          mouseout: () => resetLayer(leafletLayer, project),
        });
      },
    }).addTo(map);

    const refreshWeights = () => {
      geoJsonLayer.eachLayer((layer) => {
        layer.setStyle(getStyle(layer.feature?.properties?.__project));
      });
    };

    map.on('zoomend', refreshWeights);

    return () => {
      map.off('zoomend', refreshWeights);
      map.removeLayer(geoJsonLayer);
    };
  }, [map, mapdata]);

  return null;
};

const MapComponent = ({ mapdata }) => {
  const bounds = [
    [-90, -180],
    [90, 180],
  ];

  return (
    <>
      <MapContainer
        className={styles.map}
        center={[20, 78]}
        zoom={4.5}
        minZoom={4}
        preferCanvas={true}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          noWrap={true}
          continuousWorld={false}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="OpenStreetMap contributors"
        />

        <BoundaryLayer data={indiaBoundaryLines} />
        <RoadLayer mapdata={mapdata} />

        <div className={styles.legend}>
          <div className={styles.legendTitle}>Layer key</div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.completedSwatch}`} />
            <span>Completed</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.ucSwatch}`} />
            <span>Under construction</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.proposedSwatch}`} />
            <span>Proposed</span>
          </div>
        </div>
      </MapContainer>
    </>
  );
};

export default MapComponent;