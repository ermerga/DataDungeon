import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN


console.log('MAPBOX TOKEN:', import.meta.env.VITE_MAPBOX_TOKEN)

// Cache County, Utah center coordinates
const CACHE_COUNTY_CENTER = [-111.7, 41.74]
const DEFAULT_ZOOM = 10

export default function ParcelMap({ onParcelDrawn }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const drawingPoints = useRef([])
  const markers = useRef([])
  const [pointCount, setPointCount] = useState(0)

  useEffect(() => {
    if (map.current) return // already initialized

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: CACHE_COUNTY_CENTER,
      zoom: DEFAULT_ZOOM
    })

    map.current.on('load', () => {
      // Add source for the drawn polygon
      map.current.addSource('parcel', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[]] }
        }
      })

      // Polygon fill layer
      map.current.addLayer({
        id: 'parcel-fill',
        type: 'fill',
        source: 'parcel',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.3
        }
      })

      // Polygon outline layer
      map.current.addLayer({
        id: 'parcel-outline',
        type: 'line',
        source: 'parcel',
        paint: {
          'line-color': '#2563eb',
          'line-width': 3
        }
      })
    })

    // Click handler to draw polygon
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      drawingPoints.current.push([lng, lat])
      setPointCount(drawingPoints.current.length)

      // Add marker at click point
      const marker = new mapboxgl.Marker({ color: '#2563eb', scale: 0.7 })
        .setLngLat([lng, lat])
        .addTo(map.current)
      markers.current.push(marker)

      // Update polygon on map
      if (drawingPoints.current.length >= 3) {
        const coordinates = [...drawingPoints.current, drawingPoints.current[0]]
        
        map.current.getSource('parcel')?.setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        })

        // Create GeoJSON and pass to parent
        const geojson = {
          type: 'Polygon',
          coordinates: [coordinates]
        }
        onParcelDrawn?.(geojson)
      }
    })

    // Right-click to clear
    map.current.on('contextmenu', (e) => {
      e.preventDefault()
      clearDrawing()
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  const clearDrawing = () => {
    drawingPoints.current = []
    setPointCount(0)
    
    // Remove markers
    markers.current.forEach(m => m.remove())
    markers.current = []

    // Clear polygon
    map.current?.getSource('parcel')?.setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[]] }
    })

    onParcelDrawn?.(null)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      
      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(0,0,0,0.75)',
        color: 'white',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 13,
        maxWidth: 240
      }}>
        <strong style={{ fontSize: 14 }}>Draw your parcel</strong><br />
        <span style={{ opacity: 0.9 }}>Click to add points (min 3). Right-click to clear.</span>
      </div>

      {/* Clear button */}
      {pointCount > 0 && (
        <button
          onClick={clearDrawing}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          Clear Drawing
        </button>
      )}
    </div>
  )
}