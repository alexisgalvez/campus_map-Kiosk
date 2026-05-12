import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker,
  useMapsLibrary,
  useMap
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin, Sliders, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LocateFixed, Move, Save, CheckCircle2, AlertCircle, ShieldCheck, X, Delete } from 'lucide-react';

// Import the permanent configuration
import initialConfig from '../config/kiosk-config.json';

/**
 * Admin PIN Modal Component
 */
const AdminPinModal = ({ isOpen, onClose, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const correctPin = '0307';

  const handleKeypad = (val) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin === correctPin) {
        onUnlock();
        setPin('');
      } else if (newPin.length === 4) {
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 600);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`bg-slate-900 border border-white/10 p-10 rounded-[48px] shadow-3xl w-[400px] text-center transform transition-all ${isError ? 'animate-shake' : 'animate-in zoom-in-95 duration-300'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="bg-blue-500/20 p-3 rounded-2xl"><ShieldCheck className="w-8 h-8 text-blue-500" /></div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X /></button>
        </div>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Admin Access</h2>
        <p className="text-slate-400 font-bold text-sm mb-10">Please enter your 4-digit security PIN</p>

        <div className="flex justify-center gap-4 mb-12">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i ? 'bg-blue-500 border-blue-500 scale-125' : 'border-slate-700'
              } ${isError ? 'bg-red-500 border-red-500' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              onClick={() => handleKeypad(num.toString())}
              className="h-20 bg-slate-800/50 hover:bg-slate-700 rounded-3xl text-2xl font-black text-white active:scale-90 transition-all border border-white/5"
            >
              {num}
            </button>
          ))}
          <div />
          <button 
            onClick={() => handleKeypad('0')}
            className="h-20 bg-slate-800/50 hover:bg-slate-700 rounded-3xl text-2xl font-black text-white active:scale-90 transition-all border border-white/5"
          >
            0
          </button>
          <button 
            onClick={() => setPin('')}
            className="h-20 flex items-center justify-center text-slate-500 hover:text-white"
          >
            <Delete className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Optimized OverlayView
 */
const OverlayView = ({ position, width, rotation, children, pane = 'overlayLayer' }) => {
  const map = useMap();
  const container = useMemo(() => document.createElement('div'), []);

  useEffect(() => {
    if (!map || !window.google) return;
    const overlay = new window.google.maps.OverlayView();
    overlay.onAdd = function() {
      const panes = this.getPanes();
      panes[pane].appendChild(container);
    };
    overlay.draw = function() {
      const projection = this.getProjection();
      const currentMap = this.getMap();
      if (!projection || !currentMap) return;
      const centerLatLng = new window.google.maps.LatLng(position.lat, position.lng);
      const geoWidth = width * 0.00001; 
      const edgeLatLng = new window.google.maps.LatLng(position.lat, position.lng + geoWidth / 2);
      const pCenter = projection.fromLatLngToDivPixel(centerLatLng);
      const pEdge = projection.fromLatLngToDivPixel(edgeLatLng);
      if (pCenter && pEdge) {
        const pixelWidth = Math.abs(pEdge.x - pCenter.x) * 2;
        container.style.position = 'absolute';
        container.style.left = `${pCenter.x}px`;
        container.style.top = `${pCenter.y}px`;
        container.style.width = `${pixelWidth}px`;
        container.style.zIndex = '1';
        container.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        container.style.transformOrigin = 'center center';
      }
    };
    overlay.onRemove = function() {
      if (container.parentElement) container.parentElement.removeChild(container);
    };
    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [map, position, width, rotation, pane, container]);

  return createPortal(children, container);
};

const CampusOverlay = ({ url, position, width, rotation, opacity = 1.0, isInteractive, onNudge, pane }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState(null);
  const map = useMap();

  const handleMouseDown = (e) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (map) map.setOptions({ gestureHandling: 'none' });
  };

  useEffect(() => {
    if (!isDragging || !lastMousePos) return;
    const handleMouseMove = (e) => {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      onNudge(dx, dy);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setLastMousePos(null);
      if (map) map.setOptions({ gestureHandling: 'greedy' });
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, lastMousePos, onNudge, map]);

  return (
    <OverlayView position={position} width={width} rotation={rotation} pane={pane}>
      <div 
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: 'auto',
          opacity: opacity,
          pointerEvents: isInteractive ? 'auto' : 'none',
          cursor: isInteractive ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          outline: isInteractive ? '3px dashed rgba(255, 165, 0, 0.8)' : 'none',
          backgroundColor: isInteractive ? 'rgba(255,255,255,0.05)' : 'transparent',
          boxShadow: isDragging ? '0 0 50px rgba(0,0,0,0.5)' : 'none',
          transition: 'opacity 0.3s ease, outline 0.3s ease'
        }}
      >
        <img 
          src={url} 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
          alt="Campus Overlay" 
          draggable="false"
        />
        {isInteractive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-amber-500 rounded-full border-4 border-white shadow-2xl animate-pulse pointer-events-none" />
        )}
      </div>
    </OverlayView>
  );
};

const AnimatedPath = ({ path }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !path || path.length === 0 || !window.google || !window.google.maps) return;
    const lineSymbol = { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4, strokeColor: '#ff0000', strokeWeight: 4 };
    const pl = new window.google.maps.Polyline({
      path: path,
      strokeOpacity: 0,
      icons: [{ icon: lineSymbol, offset: '0', repeat: '20px' }],
      map: map,
      zIndex: 999999 
    });
    let count = 0;
    const animationId = setInterval(() => {
      count = (count + 1) % 200;
      const icons = pl.get('icons');
      if (icons && icons[0]) {
        icons[0].offset = (count / 2) + '%';
        pl.set('icons', icons);
      }
    }, 30);
    return () => { pl.setMap(null); clearInterval(animationId); };
  }, [map, path]);
  return null;
};

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
        strokeOpacity: 0.3,
        zIndex: 999998 
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
      setPath(response.routes[0].overview_path);
      if (onRouteUpdate) {
        const leg = response.routes[0].legs[0];
        onRouteUpdate({ distance: leg.distance.text, duration: leg.duration.text });
      }
    }).catch(e => { console.error("Directions failed", e); if (onRouteUpdate) onRouteUpdate(null); });
  }, [directionsService, directionsRenderer, from, to]);
  return <AnimatedPath path={path} />;
};

const AutoZoom = ({ kioskLocation, destination }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !kioskLocation || !destination || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: kioskLocation.lat, lng: kioskLocation.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });
    map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
  }, [map, kioskLocation, destination]);
  return null;
};

const MapViewer = ({ destination, kioskLocation, setKioskLocation, onRouteUpdate }) => {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; 
  const [is3D, setIs3D] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [calibrationSubMode, setCalibrationSubMode] = useState('map');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Admin Security State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const tripleTapTimer = useRef(null);
  const tapCount = useRef(0);

  // Custom Overlay State
  const overlayUrl = import.meta.env.VITE_CAMPUS_OVERLAY_URL;
  const [overlayWidth, setOverlayWidth] = useState(initialConfig.overlay.width);
  const [overlayRotation, setOverlayRotation] = useState(initialConfig.overlay.rotation);
  const [overlayPos, setOverlayPos] = useState(initialConfig.overlay.position);

  useEffect(() => {
    const saved = localStorage.getItem('kiosk_calibration');
    if (saved) {
      const data = JSON.parse(saved);
      setOverlayPos(data.overlay.position);
      setOverlayWidth(data.overlay.width);
      setOverlayRotation(data.overlay.rotation);
      setKioskLocation(data.kiosk);
    } else {
      setOverlayPos(initialConfig.overlay.position);
      setOverlayWidth(initialConfig.overlay.width);
      setOverlayRotation(initialConfig.overlay.rotation);
      setKioskLocation(initialConfig.kiosk);
    }
  }, []);

  const handleTripleTap = () => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tripleTapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1000);
    }
    if (tapCount.current === 3) {
      clearTimeout(tripleTapTimer.current);
      tapCount.current = 0;
      setShowPinModal(true);
    }
  };

  const nudgeOverlay = (dx, dy) => {
    if (!mapInstance || !window.google) return;
    const projection = mapInstance.getProjection();
    if (!projection) return;
    const centerLatLng = new window.google.maps.LatLng(overlayPos.lat, overlayPos.lng);
    const worldPoint = projection.fromLatLngToPoint(centerLatLng);
    const scale = Math.pow(2, mapInstance.getZoom());
    const newWorldPoint = new window.google.maps.Point(worldPoint.x + dx / scale, worldPoint.y + dy / scale);
    const newLatLng = projection.fromPointToLatLng(newWorldPoint);
    setOverlayPos({ lat: newLatLng.lat(), lng: newLatLng.lng() });
  };

  const handleMapClick = (e) => {
    if (!isCalibrating || calibrationSubMode !== 'kiosk') return;
    setKioskLocation({ ...kioskLocation, lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
  };

  const saveConfiguration = async () => {
    const configData = {
      overlay: { position: overlayPos, width: overlayWidth, rotation: overlayRotation },
      kiosk: kioskLocation
    };
    setSaveStatus('saving');
    localStorage.setItem('kiosk_calibration', JSON.stringify(configData));
    try {
      const response = await fetch('http://localhost:3001/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      if (response.ok) setSaveStatus('success');
      else throw new Error();
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const mapStyles = useMemo(() => {
    if (!isCalibrating) return [];
    return [
      { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
      { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#e0e0e0' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#cccccc' }] },
      { featureType: 'building', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#bbbbbb' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] }
    ];
  }, [isCalibrating]);

  const overlayPane = useMemo(() => {
    if (!isCalibrating) return 'mapPane';
    return calibrationSubMode === 'map' ? 'overlayMouseTarget' : 'mapPane';
  }, [isCalibrating, calibrationSubMode]);

  return (
    <div className="w-full h-full bg-slate-900 relative text-slate-100 font-sans overflow-hidden">
      {/* Secret Ghost Trigger Area */}
      <div 
        onClick={handleTripleTap}
        className="absolute top-0 right-0 w-32 h-32 z-[9998] cursor-default opacity-0"
        title="Admin Trigger"
      />

      <AdminPinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)}
        onUnlock={() => {
          setShowPinModal(false);
          setIsAdmin(true);
        }}
      />

      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 43.5309, lng: -80.2285 }}
          defaultZoom={17}
          mapId={mapId}
          mapTypeId="roadmap" 
          styles={mapStyles}
          tilt={is3D ? 67.5 : 0}
          heading={is3D ? 45 : 0}
          onClick={handleMapClick}
          onCameraChanged={(ev) => setMapInstance(ev.map)}
          disableDefaultUI={true}
          gestureHandling="greedy"
        >
          {overlayUrl && showOverlay && (
            <CampusOverlay 
              url={overlayUrl} 
              position={overlayPos} 
              width={overlayWidth} 
              rotation={overlayRotation}
              opacity={isCalibrating ? (calibrationSubMode === 'map' ? 0.6 : 0.4) : 1.0} 
              isInteractive={isCalibrating && calibrationSubMode === 'map'}
              onNudge={nudgeOverlay}
              pane={overlayPane}
            />
          )}

          <Directions from={kioskLocation} to={destination} onRouteUpdate={onRouteUpdate} />
          {!isCalibrating && <AutoZoom kioskLocation={kioskLocation} destination={destination} />}

          <AdvancedMarker position={{ lat: kioskLocation.lat, lng: kioskLocation.lng }}>
            <div className="relative transform -translate-y-4">
              <div className={`p-4 rounded-full bg-blue-600 shadow-2xl border-4 border-white ${isCalibrating && calibrationSubMode === 'kiosk' ? 'animate-bounce' : 'animate-pulse'}`}>
                <Navigation className="w-8 h-8 text-white fill-white rotate-45" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-blue-600 text-white px-6 py-2 rounded-2xl text-xl font-black whitespace-nowrap shadow-2xl border-2 border-white/20">
                {isCalibrating ? (calibrationSubMode === 'kiosk' ? 'SETTING POSITION...' : 'YOU ARE HERE') : 'YOU ARE HERE'}
              </div>
            </div>
          </AdvancedMarker>

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

      {/* Admin Panel (Only visible if unlocked) */}
      {isAdmin && (
        <div className="absolute top-12 left-12 z-50 animate-in slide-in-from-left-10 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-2xl p-6 rounded-[32px] border border-blue-500/30 shadow-3xl shadow-blue-500/10 flex items-center gap-6">
            <div className="bg-blue-500 p-3 rounded-2xl shadow-lg shadow-blue-500/40">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest">Admin Dashboard</h4>
              <button 
                onClick={() => setIsCalibrating(!isCalibrating)}
                className={`mt-1 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-tighter transition-all ${isCalibrating ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {isCalibrating ? 'Exit Calibration' : 'Enter Calibration'}
              </button>
            </div>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <button 
              onClick={() => setShowOverlay(!showOverlay)}
              className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-tighter transition-all ${!showOverlay ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {showOverlay ? 'Hide Map' : 'Show Map'}
            </button>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <button 
              onClick={() => setIsAdmin(false)}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all"
              title="Lock Admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-12 right-12 z-50 flex flex-col gap-6">
        {isCalibrating && (
          <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-[40px] shadow-3xl border border-white/10 w-[480px] mb-6 animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/20 p-3 rounded-2xl"><Sliders className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h3 className="text-white font-black text-xl uppercase tracking-wider">Calibration Suite</h3>
                  <p className="text-slate-400 text-sm font-bold">Bridge Server: {saveStatus === 'error' ? 'Offline' : 'Connected'}</p>
                </div>
              </div>
              
              <button 
                onClick={saveConfiguration}
                disabled={saveStatus === 'saving'}
                className={`relative overflow-hidden group px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                  saveStatus === 'success' ? 'bg-emerald-500 text-white' : 
                  saveStatus === 'error' ? 'bg-amber-500 text-slate-900' : 
                  'bg-white text-slate-900 hover:bg-slate-200 shadow-xl'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'WRITING...' : 
                 saveStatus === 'success' ? 'SYNCED!' : 
                 saveStatus === 'error' ? 'LOCAL ONLY' : 
                 'SAVE DATA'}
              </button>
            </div>

            <div className="flex gap-2 p-2 bg-slate-800/50 rounded-2xl mb-8">
              <button onClick={() => setCalibrationSubMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${calibrationSubMode === 'map' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><Move className="w-4 h-4" />Align Map</button>
              <button onClick={() => setCalibrationSubMode('kiosk')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${calibrationSubMode === 'kiosk' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><LocateFixed className="w-4 h-4" />Set Kiosk</button>
            </div>

            <div className="space-y-8">
              {calibrationSubMode === 'map' ? (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1"><label className="text-slate-300 font-black text-xs uppercase tracking-widest">Rotation Angle</label><span className="bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-black text-xs">{overlayRotation}°</span></div>
                    <input type="range" min="-180" max="180" value={overlayRotation} onChange={(e) => setOverlayRotation(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1"><label className="text-slate-300 font-black text-xs uppercase tracking-widest">Map Scale</label><span className="bg-blue-500 text-white px-3 py-1 rounded-lg font-black text-xs">{overlayWidth}</span></div>
                    <input type="range" min="1000" max="8000" value={overlayWidth} onChange={(e) => setOverlayWidth(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                  </div>
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                      <div /><button onClick={() => nudgeOverlay(0, -1)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 flex justify-center"><ChevronUp className="w-6 h-6" /></button><div />
                      <button onClick={() => nudgeOverlay(-1, 0)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 flex justify-center"><ChevronLeft className="w-6 h-6" /></button>
                      <div className="flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">MOVE</div>
                      <button onClick={() => nudgeOverlay(1, 0)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 flex justify-center"><ChevronRight className="w-6 h-6" /></button>
                      <div /><button onClick={() => nudgeOverlay(0, 1)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 flex justify-center"><ChevronDown className="w-6 h-6" /></button><div />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20"><LocateFixed className="w-8 h-8 text-white" /></div>
                  <h4 className="text-white font-black text-lg">Positioning Kiosk</h4>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">Click anywhere on the map to place the marker. <br /> Then click <span className="text-white">SAVE DATA</span> to update the local file.</p>
                </div>
              )}
            </div>
            
            {saveStatus === 'error' && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-amber-400 uppercase leading-tight">Bridge server offline. Run "node save-config-server.js" to sync.</p>
              </div>
            )}
          </div>
        )}
        <button onClick={() => setIs3D(!is3D)} className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col gap-2 hover:bg-slate-800 transition-all active:scale-95">
          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-1">VIEW MODE</p>
          <div className={`px-5 py-2 rounded-xl text-center font-black text-sm uppercase tracking-widest transition-all ${is3D ? 'bg-primary text-white' : 'bg-slate-700 text-slate-300'}`}>{is3D ? '3D VIEW' : '2D VIEW'}</div>
        </button>
      </div>
    </div>
  );
};

export default MapViewer;
