import { useEffect, useRef, useCallback } from 'react';

const MapContainer = ({ onMapClick, targetLocation, craterInfo }) => {
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

  // Handle crater overlay
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Remove existing crater overlay if any
    if (craterOverlayRef.current) {
      craterOverlayRef.current.setMap(null);
      craterOverlayRef.current = null;
    }

    // Create new crater overlay if craterInfo is provided
    if (craterInfo) {
      class CraterOverlay extends window.google.maps.OverlayView {
        constructor(position, pixelSize) {
          super();
          this.position = position;
          // Convert pixel size to meters (approximate: 100px = ~100 meters at default zoom)
          // This is a rough approximation - we'll calculate actual bounds based on meters
          this.radiusMeters = pixelSize * 1.5; // Scale factor for realistic crater size
          this.div = null;
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.borderRadius = '50%';
          div.style.background = 'radial-gradient(circle at 40% 40%, rgba(40, 40, 40, 0.9), rgba(20, 20, 20, 0.95), rgba(10, 10, 10, 0.8))';
          div.style.boxShadow = 'inset 0 0 50px rgba(0, 0, 0, 0.9), inset 0 0 100px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 100, 0, 0.3)';
          div.style.pointerEvents = 'none';
          div.style.border = '3px solid rgba(60, 40, 30, 0.8)';
          this.div = div;

          const panes = this.getPanes();
          panes.overlayLayer.appendChild(div);
        }

        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;

          // Calculate crater bounds based on radius in meters
          // Use google.maps.geometry.spherical.computeOffset to get edge points
          const map = this.getMap();
          if (!map || !window.google.maps.geometry) return;

          // Calculate a point at the edge of the crater (to the east)
          const edgePoint = window.google.maps.geometry.spherical.computeOffset(
            this.position,
            this.radiusMeters,
            90 // heading east
          );

          // Convert both center and edge to pixel coordinates
          const centerPixel = projection.fromLatLngToDivPixel(this.position);
          const edgePixel = projection.fromLatLngToDivPixel(edgePoint);

          if (centerPixel && edgePixel) {
            // Calculate pixel radius from the distance between center and edge
            const pixelRadius = Math.abs(edgePixel.x - centerPixel.x);
            const diameter = pixelRadius * 2;

            this.div.style.left = (centerPixel.x - pixelRadius) + 'px';
            this.div.style.top = (centerPixel.y - pixelRadius) + 'px';
            this.div.style.width = diameter + 'px';
            this.div.style.height = diameter + 'px';
          }
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const crater = new CraterOverlay(
        new window.google.maps.LatLng(craterInfo.lat, craterInfo.lng),
        craterInfo.size
      );
      crater.setMap(googleMapRef.current);
      craterOverlayRef.current = crater;
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
    />
  );
};

export default MapContainer;