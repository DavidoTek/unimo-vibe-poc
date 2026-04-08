// src/components/map/MapCanvas.tsx
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapCanvas() {
  return (
    <Map
      initialViewState={{
        longitude: 13.405,
        latitude: 52.52,
        zoom: 13
      }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
      {/* Markers and Polylines will be added here later */}
    </Map>
  );
}