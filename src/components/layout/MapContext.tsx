"use client"

import React from "react"

interface MapContextType {
  map: google.maps.Map | null
  setMap: (map: google.maps.Map | null) => void
  zoomIn: () => void
  zoomOut: () => void
  panTo: (lat: number, lng: number) => void
  centerOnUserLocation: () => void
  searchLocation: { lat: number; lng: number } | null
  setSearchLocation: (location: { lat: number; lng: number } | null) => void
}

const MapContext = React.createContext<MapContextType | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = React.useState<google.maps.Map | null>(null)
  const [searchLocation, setSearchLocation] = React.useState<{ lat: number; lng: number } | null>(null)

  const zoomIn = React.useCallback(() => {
    if (!map) return
    const currentZoom = map.getZoom() || 12
    map.setZoom(currentZoom + 1)
  }, [map])

  const zoomOut = React.useCallback(() => {
    if (!map) return
    const currentZoom = map.getZoom() || 12
    map.setZoom(currentZoom - 1)
  }, [map])

  const panTo = React.useCallback((lat: number, lng: number) => {
    if (!map) return
    map.panTo({ lat, lng })
    map.setZoom(15) // Zoom in when panning to a specific location
  }, [map])

  const centerOnUserLocation = React.useCallback(() => {
    if (!map) return
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map.panTo({ lat: latitude, lng: longitude })
          map.setZoom(15)
        },
        (error) => {
          alert("No se pudo obtener tu ubicación. Asegúrate de dar permisos de ubicación.")
        }
      )
    } else {
      alert("Tu navegador no soporta geolocalización")
    }
  }, [map])

  // Listen for custom events from SearchBar
  React.useEffect(() => {
    const handlePanTo = (event: Event) => {
      const customEvent = event as CustomEvent<{ lat: number; lng: number }>
      if (customEvent.detail) {
        panTo(customEvent.detail.lat, customEvent.detail.lng)
      }
    }

    window.addEventListener('map:panTo', handlePanTo)
    return () => window.removeEventListener('map:panTo', handlePanTo)
  }, [panTo])

  const value = React.useMemo(
    () => ({
      map,
      setMap,
      zoomIn,
      zoomOut,
      panTo,
      centerOnUserLocation,
      searchLocation,
      setSearchLocation,
    }),
    [map, zoomIn, zoomOut, panTo, centerOnUserLocation, searchLocation]
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

export function useMap() {
  const context = React.useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
