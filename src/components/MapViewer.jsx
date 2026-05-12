import React, { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker,
  useMapsLibrary,
  useMap
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin } from 'lucide-react';

// Component to overlay a custom campus map image
const CampusOverlay = ({ url, bounds, opacity = 1.0 }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !url || !bounds || !window.google) return;

    const overlay = new window.google.maps.GroundOverlay(url, bounds, {
      clickable: false,
      opacity: opacity
    });

    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, url, bounds, opacity]);

  return null;
};

// Custom animated polyline for the "marching ants" effect
const AnimatedPath = ({ path }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    if (!map || !path || path.length === 0 || !window.google || !window.google.maps) return;

    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 4,
      strokeColor: '#ff0000',
      strokeWeight: 4
    };

    const pl = new window.google.maps.Polyline({
      path: path,
      strokeOpacity: 0,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '20px'
      }],
      map: map,
      zIndex: 100
    });

    setPolyline(pl);

    let count = 0;
    const animationId = setInterval(() => {
      count = (count + 1) % 200;
      const icons = pl.get('icons');
      if (icons && icons[0]) {
        icons[0].offset = (count / 2) + '%';
        pl.set('icons', icons);
      }
    }, 30);

    return () => {
      pl.setMap(null);
      clearInterval(animationId);
    };
  }, [map, path]);

  return null;
};

// Directions component to handle pathfinding
const Directions = ({ from, to, onRouteUpdate }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const ds = new routesLibrary.DirectionsService();
    const dr = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#e62b1e',
        strokeWeight: 8,
        strokeOpacity: 0.3
      }
    });
    setDirectionsService(ds);
    setDirectionsRenderer(dr);

    return () => dr.setMap(null);
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !from || !to || !window.google) {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      setPath([]);
      return;
    }

    directionsService.route({
      origin: { lat: from.lat, lng: from.lng },
      destination: { lat: to.lat, lng: to.lng },
      travelMode: 'WALKING',
    }).then(response => {
      directionsRenderer.setDirections(response);
      const routePath = response.routes[0].overview_path;
      setPath(routePath);

      if (onRouteUpdate) {
        const leg = response.routes[0].legs[0];
        onRouteUpdate({
          distance: leg.distance.text,
          duration: leg.duration.text
        });
      }
    }).catch(e => {
      console.error("Directions request failed", e);
      if (onRouteUpdate) onRouteUpdate(null);
    });
  }, [directionsService, directionsRenderer, from, to]);

  return <AnimatedPath path={path} />;
};

// Auto-zoom component to fit both points on screen
const AutoZoom = ({ kioskLocation, destination }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !kioskLocation || !destination || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: kioskLocation.lat, lng: kioskLocation.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });

    // Fit map to show both points with massive padding for maximum campus context
    map.fitBounds(bounds, {
      top: 800,
      right: 800,
      bottom: 800,
      left: 800
    });
  }, [map, kioskLocation, destination]);

  return null;
};

const MapViewer = ({ destination, kioskLocation, setKioskLocation, isCalibrating, onRouteUpdate }) => {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; 
  const [mapTypeId, setMapTypeId] = useState('roadmap'); 
  const [is3D, setIs3D] = useState(false);

  const overlayUrl = import.meta.env.VITE_CAMPUS_OVERLAY_URL;
  
  // Define the geographic area where your custom map image will be "pinned"
  // You can adjust these coordinates to align your image perfectly
  const CAMPUS_BOUNDS = {
    north: 43.5350,
    south: 43.5250,
    east: -80.2200,
    west: -80.2350,
  };

  const handleMapClick = (e) => {
    if (!isCalibrating) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    
    setKioskLocation({
      ...kioskLocation,
      lat,
      lng
    });
  };

  const toggleMapType = () => {
    setMapTypeId(prev => prev === 'satellite' ? 'roadmap' : 'satellite');
  };

  const toggle3D = () => {
    const next3D = !is3D;
    setIs3D(next3D);
    // If turning on 3D, automatically switch to satellite for the "Google Earth" effect
    if (next3D) {
      setMapTypeId('satellite');
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 relative">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 43.5309, lng: -80.2285 }}
          defaultZoom={17}
          mapId={mapId}
          mapTypeId={mapTypeId}
          tilt={is3D ? 67.5 : 0}
          heading={is3D ? 45 : 0}
          onClick={handleMapClick}
          disableDefaultUI={true}
          gestureHandling={isCalibrating ? 'none' : 'greedy'}
        >
          {/* Custom Campus Map Overlay - Becomes 50% transparent during calibration for alignment */}
          {overlayUrl && (
            <CampusOverlay 
              url={overlayUrl} 
              bounds={CAMPUS_BOUNDS} 
              opacity={isCalibrating ? 0.5 : 1.0} 
            />
          )}

          {/* Real-time Directions with Marching Ants */}
          <Directions from={kioskLocation} to={destination} onRouteUpdate={onRouteUpdate} />

          {/* Auto-zoom when destination changes */}
          <AutoZoom kioskLocation={kioskLocation} destination={destination} />

          {/* Kiosk Marker Overlay */}
          <AdvancedMarker position={{ lat: kioskLocation.lat, lng: kioskLocation.lng }}>
            <div className="relative transform -translate-y-4">
              <div className={`p-4 rounded-full bg-blue-600 shadow-2xl border-4 border-white ${isCalibrating ? 'animate-bounce' : 'animate-pulse'}`}>
                <Navigation className="w-8 h-8 text-white fill-white rotate-45" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-blue-600 text-white px-6 py-2 rounded-2xl text-xl font-black whitespace-nowrap shadow-2xl border-2 border-white/20">
                {isCalibrating ? 'SET KIOSK POSITION' : 'YOU ARE HERE'}
              </div>
            </div>
          </AdvancedMarker>

          {/* Destination Marker Overlay */}
          {destination && (
            <AdvancedMarker position={{ lat: destination.lat, lng: destination.lng }}>
              <div className="relative transform -translate-y-4">
                <div className="p-4 rounded-full bg-primary shadow-2xl border-4 border-white animate-bounce">
                  <MapPin className="w-10 h-10 text-white fill-white" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-primary text-white px-6 py-2 rounded-2xl text-xl font-black whitespace-nowrap shadow-2xl border-2 border-white/20 uppercase tracking-wider">
                  {destination.name}
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      <div className="absolute bottom-12 right-12 z-50 flex flex-col gap-6">
        {/* 3D Toggle Button */}
        <button 
          onClick={toggle3D}
          className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col gap-2 hover:bg-slate-800 transition-all active:scale-95"
        >
          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-1">VIEW MODE</p>
          <div className={`px-5 py-2 rounded-xl text-center font-black text-sm uppercase tracking-widest transition-all ${
            is3D ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {is3D ? '3D VIEW' : '2D VIEW'}
          </div>
        </button>

        <button 
          onClick={toggleMapType}
          className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col gap-2 hover:bg-slate-800 transition-all active:scale-95"
        >
          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-1">MAP TYPE</p>
          <div className={`px-5 py-2 rounded-xl text-center font-black text-sm uppercase tracking-widest transition-all ${
            mapTypeId === 'satellite' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {mapTypeId === 'satellite' ? 'SATELLITE' : 'STANDARD'}
          </div>
        </button>
      </div>
    </div>
  );
};

export default MapViewer;
