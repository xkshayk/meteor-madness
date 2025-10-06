import { useEffect, useRef, useCallback } from 'react';

const MapContainer = ({ onMapClick, targetLocation, craterInfo, isLaunching }) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const clickListenerRef = useRef(null);
  const overlayRef = useRef(null);
  const craterOverlayRef = useRef(null);



  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    let pixelX = null;
    let pixelY = null;

    // Check if overlay is ready
    if (overlayRef.current) {
      try {
        const pixel = overlayRef.current.getPixelCoordinates(event.latLng);
        if (pixel && mapRef.current) {
          const mapRect = mapRef.current.getBoundingClientRect();
          pixelX = mapRect.left + pixel.x;
          pixelY = mapRect.top + pixel.y;
          
          console.log('✓ Pixel coords calculated:', { pixelX, pixelY });
        } else {
          console.log('✗ Overlay projection not ready');
        }
      } catch (e) {
        console.error('Error getting pixel coords:', e);
      }
    } else {
      console.log('✗ Overlay not initialized');
    }

    onMapClick({ 
      lat, 
      lng,
      pixelX,
      pixelY
    });
  }, [onMapClick]);

  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && mapRef.current) {
        clearInterval(checkGoogleMaps);
        
        if (!googleMapRef.current) {
          // Dark mode map styles
          const darkModeStyles = [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ];

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.0060 },
            zoom: 8,
            mapTypeControl: true,
            styles: darkModeStyles,
            gestureHandling: 'greedy',
          });

          googleMapRef.current = map;
          window.asteroidMap = map;
          window.asteroidMapDiv = mapRef.current;

          clickListenerRef.current = map.addListener('click', handleMapClick);
          
          console.log('Map initialized');

          // Create overlay after map is idle
          const idleListener = map.addListener('idle', () => {
            class CoordinateOverlay extends window.google.maps.OverlayView {
              onAdd() {
                console.log('✓ Overlay added and ready');
              }
              
              draw() {}
              
              onRemove() {}

              getPixelCoordinates(latLng) {
                const projection = this.getProjection();
                if (projection) {
                  return projection.fromLatLngToContainerPixel(latLng);
                }
                return null;
              }
            }

            const overlay = new CoordinateOverlay();
            overlay.setMap(map);
            overlayRef.current = overlay;
            window.asteroidOverlay = overlay;
            
            // Remove this listener
            window.google.maps.event.removeListener(idleListener);
          });
        }
      }
    }, 100);

    return () => {
      clearInterval(checkGoogleMaps);
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [handleMapClick]);

  // Disable map interaction when asteroid is launching
  useEffect(() => {
    if (!googleMapRef.current) return;

    const map = googleMapRef.current;
    
    if (isLaunching) {
      // Disable all map interaction
      map.setOptions({
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: 'none',
      });
    } else {
      // Re-enable map interaction
      map.setOptions({
        draggable: true,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        gestureHandling: 'greedy',
      });
    }
  }, [isLaunching]);

  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    if (targetLocation) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: targetLocation.lat, lng: targetLocation.lng },
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
      });
      
      window.asteroidMarker = markerRef.current;
    }
  }, [targetLocation]);

  // Handle crater overlay - using Circle like the marker for consistent behavior
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Remove existing crater if any
    if (craterOverlayRef.current) {
      craterOverlayRef.current.setMap(null);
      craterOverlayRef.current = null;
    }

    // Create new crater circle if craterInfo is provided
    if (craterInfo) {
      // Create crater using google.maps.Circle - same approach as marker
      const crater = new window.google.maps.Circle({
        strokeColor: 'rgba(40, 25, 10, 0.95)',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        fillColor: 'rgba(0, 0, 0, 0.9)',
        fillOpacity: 0.95,
        map: googleMapRef.current,
        center: { lat: craterInfo.lat, lng: craterInfo.lng },
        radius: craterInfo.size * 10, // Convert to meters (size * 10 for visible craters)
        clickable: false,
      });
      
      craterOverlayRef.current = crater;
      console.log(`[CRATER CIRCLE] Created at (${craterInfo.lat}, ${craterInfo.lng}) with radius ${craterInfo.size * 10}m`);
    }
  }, [craterInfo]);

  return (
    <div 
      ref={mapRef}
      style={{
        width: 'calc(100vw - 384px)',
        height: '100vh',
        position: 'absolute',
        left: 0,
        top: 0,
      }}
    >
      {isLaunching && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            pointerEvents: 'all',
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '40px',
          }}
        >
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '16px 24px',
            borderRadius: '8px',
            border: '2px solid rgba(255, 102, 0, 0.6)',
            color: '#ff6600',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 0 20px rgba(255, 102, 0, 0.4)',
          }}>
            🚀 ASTEROID IN FLIGHT - MAP LOCKED
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;