"use client";

import React from "react";
import { Map, useMap as useGoogleMap } from "@vis.gl/react-google-maps";
import { useMap } from "./MapContext";

function MapInstance() {
  const googleMap = useGoogleMap();
  const { setMap } = useMap();

  React.useEffect(() => {
    if (googleMap) {
      setMap(googleMap);
    }
  }, [googleMap, setMap]);

  return null;
}

interface MapContainerProps {
  children?: React.ReactNode;
}

export default function MapContainer({ children }: MapContainerProps) {
  const defaultCenter = { lat: 19.432608, lng: -99.133209 };
  const defaultZoom = 12;

  return (
    <div className="absolute inset-0 h-full w-full" data-slot="map-container">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI={true}
        style={{ width: "100%", height: "100%" }}
        mapId="ungga-map"
      >
        <MapInstance />
        {children}
      </Map>
    </div>
  );
}
