import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker,
  useMapsLibrary,
  useMap
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin, Sliders, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LocateFixed, Move, Save, CheckCircle2, AlertCircle, ShieldCheck, X, Delete, Building, BookOpen, Search, LayoutDashboard } from 'lucide-react';

// Remove static config import - now using props from Google Sheets
// import initialConfig from '../config/kiosk-config.json';
import CesiumMap3D from './CesiumMap3D';

/**
 * Admin PIN Modal Component
 */
const AdminPinModal = ({ isOpen, onClose, onUnlock, settings }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const correctPin = String(settings?.admin_pin || '0307');

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
 * StreetView Virtual Experience Component
 */
const StreetViewModal = ({ building, onClose }) => {
  const panoRef = useRef(null);

  useEffect(() => {
    if (!panoRef.current || !window.google || !building) return;
    
    const pano = new window.google.maps.StreetViewPanorama(panoRef.current, {
      position: { 
        lat: parseFloat(building.pano_lat) || building.lat, 
        lng: parseFloat(building.pano_lng) || building.lng 
      },
      pov: { 
        heading: parseFloat(building.pano_heading) || 0, 
        pitch: 0 
      },
      zoom: 1,
      addressControl: false,
      showRoadLabels: false,
      motionTracking: false,
      motionTrackingControl: false,
      panControl: true,
      zoomControl: true,
      enableCloseButton: false
    });

    return () => {
      // Native cleanup if necessary
    };
  }, [building]);

  if (!building) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col animate-in fade-in duration-500">
      <div className="p-8 bg-slate-900 border-b border-white/10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="bg-blue-500/20 p-4 rounded-2xl">
            <Building className="w-8 h-8 text-blue-400" />
          </div>
          <div>
             <h2 className="text-3xl font-black text-white">{building.name}</h2>
             <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">360° Virtual Experience</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="group flex items-center gap-3 px-6 py-4 bg-slate-800 rounded-2xl hover:bg-red-500 transition-all text-white font-black uppercase tracking-widest border border-white/5"
        >
          <span>Close Tour</span>
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>
      <div ref={panoRef} className="flex-1" />
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
        container.style.zIndex = '1000'; // Higher z-index for the overlay
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
          cursor: isInteractive ? (isDragging ? 'grabbing' : 'grab') : (pane === 'overlayMouseTarget' ? 'crosshair' : 'default'),
          userSelect: 'none',
          outline: isInteractive ? '3px dashed rgba(255, 165, 0, 0.8)' : 'none',
          backgroundColor: isInteractive ? 'rgba(255,255,255,0.05)' : 'transparent',
          boxShadow: isDragging ? '0 0 50px rgba(0,0,0,0.5)' : 'none',
          transition: 'opacity 0.3s ease, outline 0.3s ease'
        }}
      >
        <img 
          src={url} 
          onLoad={() => console.log('Overlay Map Loaded Successfully:', url)}
          onError={(e) => console.error('Overlay Map Load Failed:', url, e)}
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

const Directions = ({ from, to, onRouteUpdate, onPathUpdate }) => {
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
      const newPath = response.routes[0].overview_path;
      setPath(newPath);
      if (onPathUpdate) onPathUpdate(newPath);
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

// Master list of buildings is now passed in via props
// const buildings = [...];

// buildings.forEach(b => { if (!b.entrances) b.entrances = Math.floor(Math.random() * 3) + 1; });

/**
 * Admin Dashboard Component
 */
const BuildingDashboard = ({ isOpen, onClose, buildings }) => {
  if (!isOpen) return null;

  const stats = {
    total: buildings.length,
    academic: buildings.filter(b => b.category === 'academic').length,
    residence: buildings.filter(b => b.category === 'residence').length,
    services: buildings.filter(b => b.category === 'services').length,
    totalEntrances: buildings.reduce((acc, b) => acc + (b.entrances || 0), 0)
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-12">
      <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-[48px] border border-white/10 shadow-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Campus Inventory Dashboard</h2>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Real-time Building & Infrastructure Metrics</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-800 rounded-3xl hover:bg-slate-700 transition-all text-white border border-white/10">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            <div className="bg-blue-600 p-8 rounded-[32px] shadow-xl">
              <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Total Buildings</p>
              <h3 className="text-5xl font-black text-white">{stats.total}</h3>
            </div>
            <div className="bg-emerald-600 p-8 rounded-[32px] shadow-xl">
              <p className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-2">Active Entrances</p>
              <h3 className="text-5xl font-black text-white">{stats.totalEntrances}</h3>
            </div>
            <div className="bg-amber-600 p-8 rounded-[32px] shadow-xl">
              <p className="text-amber-200 text-xs font-black uppercase tracking-widest mb-2">Academic Halls</p>
              <h3 className="text-5xl font-black text-white">{stats.academic}</h3>
            </div>
            <div className="bg-purple-600 p-8 rounded-[32px] shadow-xl">
              <p className="text-purple-200 text-xs font-black uppercase tracking-widest mb-2">Residences</p>
              <h3 className="text-5xl font-black text-white">{stats.residence}</h3>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-slate-800/30 rounded-[32px] border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">ID</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Building Name</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Entrances</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {buildings.map(b => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-500 font-mono">{b.id}</td>
                    <td className="p-6 font-black text-white text-lg">{b.name}</td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        b.category === 'academic' ? 'bg-amber-500/20 text-amber-500' :
                        b.category === 'residence' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {b.category}
                      </span>
                    </td>
                    <td className="p-6 text-center font-black text-2xl text-emerald-400">{b.entrances}</td>
                    <td className="p-6 text-slate-400 font-mono text-sm">{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapViewer = ({ 
  destination, 
  kioskLocation, 
  setKioskLocation, 
  locationOverrides, 
  setLocationOverrides, 
  onRouteUpdate, 
  is3D, 
  setIs3D,
  buildings = [],
  settings = {},
  activePano,
  setActivePano
}) => {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID; 
  const [mapInstance, setMapInstance] = useState(null);
  const [calibrationSubMode, setCalibrationSubMode] = useState('map');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [routePath, setRoutePath] = useState(null);

  // Admin Security State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showBuildingDashboard, setShowBuildingDashboard] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const tripleTapTimer = useRef(null);
  const tapCount = useRef(0);

  // Custom Overlay State
  const overlayUrl = settings?.overlay_url || import.meta.env.VITE_CAMPUS_OVERLAY_URL;
  console.log('Current Overlay URL:', overlayUrl);
  const [overlayWidth, setOverlayWidth] = useState(settings?.overlay_width || 500);
  const [overlayRotation, setOverlayRotation] = useState(settings?.overlay_rotation || 0);
  const [overlayPos, setOverlayPos] = useState({ 
    lat: settings?.overlay_lat || 43.5309, 
    lng: settings?.overlay_lng || -80.2285 
  });

  // Individual Building Calibration State
  const [buildingOffsets, setBuildingOffsets] = useState(settings?.building_calibration || {});

  useEffect(() => {
    const saved = localStorage.getItem('kiosk_calibration');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.overlay) {
        setOverlayPos(data.overlay.position);
        setOverlayWidth(data.overlay.width);
        setOverlayRotation(data.overlay.rotation);
      }
      if (data.kiosk) setKioskLocation(data.kiosk);
    } else if (settings) {
      // Fallback to Google Sheets settings if no local calibration exists
      if (settings.overlay_lat && settings.overlay_lng) {
        setOverlayPos({ lat: settings.overlay_lat, lng: settings.overlay_lng });
      }
      if (settings.overlay_width) setOverlayWidth(settings.overlay_width);
      if (settings.overlay_rotation !== undefined) setOverlayRotation(settings.overlay_rotation);
      if (settings.kiosk_lat && settings.kiosk_lng) {
        setKioskLocation({ ...kioskLocation, lat: settings.kiosk_lat, lng: settings.kiosk_lng });
      }
      if (settings.building_calibration) {
        setBuildingOffsets(settings.building_calibration);
      }
    }
  }, [settings]);

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

  const nudgeBuilding = (id, dx, dy) => {
    if (!mapInstance || !window.google) return;
    const current = buildingOffsets[id] || { lat: 0, lng: 0, scale: 500, rotation: 0 };
    const projection = mapInstance.getProjection();
    if (!projection) return;
    
    // Find building base coords from spreadsheet
    const building = buildings.find(b => b.id === id);
    if (!building) return;

    const baseLatLng = new window.google.maps.LatLng(building.lat + (current.lat_off || 0), building.lng + (current.lng_off || 0));
    const worldPoint = projection.fromLatLngToPoint(baseLatLng);
    const scale = Math.pow(2, mapInstance.getZoom());
    const newWorldPoint = new window.google.maps.Point(worldPoint.x + dx / scale, worldPoint.y + dy / scale);
    const newLatLng = projection.fromPointToLatLng(newWorldPoint);
    
    setBuildingOffsets(prev => ({
      ...prev,
      [id]: {
        ...current,
        lat_off: newLatLng.lat() - building.lat,
        lng_off: newLatLng.lng() - building.lng
      }
    }));
  };

  const handleMapClick = (e) => {
    if (!isCalibrating) return;
    
    if (calibrationSubMode === 'kiosk') {
      setKioskLocation({ ...kioskLocation, lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
    } else if (calibrationSubMode === 'locations' && editingLocationId) {
      setLocationOverrides(prev => ({
        ...prev,
        [editingLocationId]: { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng }
      }));
    }
  };

  const saveConfiguration = async () => {
    const configData = {
      overlay: { position: overlayPos, width: overlayWidth, rotation: overlayRotation },
      kiosk: kioskLocation,
      locations: locationOverrides,
      building_calibration: buildingOffsets
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
    <div 
      className="w-full h-full bg-slate-900 relative text-slate-100 font-sans overflow-hidden"
      style={{ cursor: isCalibrating && (calibrationSubMode === 'kiosk' || calibrationSubMode === 'locations') ? 'crosshair' : 'default' }}
    >
      {/* Secret Ghost Trigger Area */}
      <div 
        onClick={handleTripleTap}
        className="absolute top-0 right-0 w-32 h-32 z-[9998] cursor-default opacity-0"
        title="Admin Trigger"
      />

      <AdminPinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)}
        settings={settings}
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
          styles={mapId ? [] : mapStyles}
          tilt={is3D ? 67.5 : 0}
          heading={is3D ? 45 : 0}
          onClick={handleMapClick}
          onCameraChanged={(ev) => setMapInstance(ev.map)}
          disableDefaultUI={true}
          gestureHandling="greedy"
          draggableCursor={isCalibrating && (calibrationSubMode === 'kiosk' || calibrationSubMode === 'locations') ? 'crosshair' : 'grab'}
          draggingCursor={isCalibrating && (calibrationSubMode === 'kiosk' || calibrationSubMode === 'locations') ? 'crosshair' : 'grabbing'}
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

          <Directions from={kioskLocation} to={destination} onRouteUpdate={onRouteUpdate} onPathUpdate={setRoutePath} />
          {!isCalibrating && <AutoZoom kioskLocation={kioskLocation} destination={destination} />}

          {/* Individual Building Overlays */}
          {buildings.filter(b => !isNaN(b.lat) && !isNaN(b.lng)).map(b => {
            const offset = buildingOffsets[b.id];
            // Only show if offset exists OR we are in admin mode for this building
            if (!offset && (!isCalibrating || calibrationSubMode !== 'locations' || selectedBuildingId !== b.id)) return null;
            
            return (
              <CampusOverlay 
                key={`b-overlay-${b.id}`}
                url={`/buildings/${b.id}.svg`}
                position={{ 
                  lat: b.lat + (offset?.lat_off || 0), 
                  lng: b.lng + (offset?.lng_off || 0) 
                }}
                width={offset?.scale || 500}
                rotation={offset?.rotation || 0}
                opacity={isCalibrating && selectedBuildingId === b.id ? 0.8 : 1.0}
                isInteractive={isCalibrating && calibrationSubMode === 'locations' && selectedBuildingId === b.id}
                onNudge={(dx, dy) => nudgeBuilding(b.id, dx, dy)}
                pane={isCalibrating && selectedBuildingId === b.id ? 'overlayMouseTarget' : 'mapPane'}
              />
            );
          })}

          {/* Dynamic Building Tooltips/Markers */}
          {settings.tooltips_enabled && !destination && !isCalibrating && buildings.filter(b => !isNaN(b.lat) && !isNaN(b.lng)).map(b => (
            <AdvancedMarker 
              key={b.id} 
              position={{ lat: b.lat, lng: b.lng }}
              onClick={() => {
                // In a real app, maybe trigger a small tooltip or select the building
              }}
            >
              <div className="group relative flex flex-col items-center">
                <div className="w-4 h-4 bg-slate-400 rounded-full border-2 border-white shadow-lg group-hover:bg-primary group-hover:scale-150 transition-all duration-300" />
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-white font-bold text-sm whitespace-nowrap">{b.name}</p>
                  </div>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {!isNaN(kioskLocation.lat) && !isNaN(kioskLocation.lng) && (
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
          )}

          {destination && !isNaN(destination.lat) && !isNaN(destination.lng) && (
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

      {/* 3D Map Overlay */}
      {is3D && (
        <div className="absolute inset-0 z-40 bg-slate-950 pointer-events-auto">
          <CesiumMap3D 
            apiKey={API_KEY} 
            destination={destination} 
            kioskLocation={kioskLocation}
            routePath={routePath}
          />
        </div>
      )}

      {/* Navigation HUD Overlay */}
      {destination && !isCalibrating && (
        <div className="absolute top-12 left-12 z-[60] animate-in slide-in-from-top-10 duration-700 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 shadow-3xl w-[500px] pointer-events-auto">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-primary/20 p-5 rounded-3xl border border-primary/30">
                <Navigation className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-slate-500 font-black text-sm uppercase tracking-[0.2em] mb-1">Current Route</h4>
                <h2 className="text-3xl font-black text-white leading-tight">To {destination.name}</h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  <div className="w-1 h-12 bg-gradient-to-b from-blue-500 via-slate-700 to-red-500 rounded-full" />
                  <div className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
                <div className="flex-1 space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">STARTING POINT</p>
                      <p className="text-lg font-bold text-slate-300">Your Current Location</p>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-3 py-1 rounded-full font-black border border-blue-500/20">KIOSK STATION</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DESTINATION</p>
                      <p className="text-lg font-bold text-white">{destination.name}</p>
                    </div>
                    <span className="bg-red-500/10 text-red-400 text-[10px] px-3 py-1 rounded-full font-black border border-red-500/20">TARGET</span>
                  </div>
                </div>
              </div>

              {onRouteUpdate && (
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL DISTANCE</p>
                    <p className="text-2xl font-black text-white">340 meters</p> 
                  </div>
                  <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">EST. WALK TIME</p>
                    <p className="text-2xl font-black text-primary">~5 minutes</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIs3D(!is3D)}
              className="w-full mt-8 bg-white/5 hover:bg-white/10 p-5 rounded-2xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${is3D ? 'bg-primary/20' : 'bg-slate-700'}`}>
                  <Move className={`w-5 h-5 ${is3D ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <span className="font-black text-xs text-slate-300 uppercase tracking-widest">{is3D ? 'Switch to 2D Map' : 'Switch to 3D Flyover'}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel (Only visible if unlocked) */}
      {isAdmin && (
        <div className="absolute top-12 right-12 z-50 animate-in slide-in-from-right-10 duration-500">
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
              onClick={() => setShowBuildingDashboard(true)}
              className="px-4 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg font-black text-[10px] uppercase tracking-tighter transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-3 h-3" />
              Building Info
            </button>
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
          <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-[40px] shadow-3xl border border-white/10 w-[480px] mb-6 animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-visible z-[1000]">
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
              <button onClick={() => setCalibrationSubMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${calibrationSubMode === 'map' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><Move className="w-3 h-3" />Align Map</button>
              <button onClick={() => setCalibrationSubMode('kiosk')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${calibrationSubMode === 'kiosk' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><LocateFixed className="w-3 h-3" />Set Kiosk</button>
              <button onClick={() => setCalibrationSubMode('locations')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${calibrationSubMode === 'locations' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><MapPin className="w-3 h-3" />Locations</button>
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
              ) : calibrationSubMode === 'kiosk' ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[32px] text-center space-y-4">
                    <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                      <LocateFixed className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white font-black text-lg uppercase tracking-wider">Kiosk Position</h4>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LAT (X)</p>
                        <p className="text-sm font-mono font-bold text-blue-400">
                          {kioskLocation.lat.toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LNG (Y)</p>
                        <p className="text-sm font-mono font-bold text-blue-400">
                          {kioskLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                      <CheckCircle2 className="w-3 h-3" /> Position Set
                    </div>
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-2xl text-center border border-white/5">
                    <p className="text-slate-400 text-[10px] font-bold leading-relaxed text-center">
                      Tap the map to place the Kiosk icon. <br /> Click <span className="text-white">SAVE DATA</span> to finalize.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Tune Destination Entrance</p>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Select a point to calibrate</p>
                    
                    <div className="relative">
                      {/* Search & Selector Integrated */}
                      <div className="relative group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isAdminDropdownOpen ? 'text-emerald-500' : 'text-slate-500'}`} />
                        <input 
                          type="text"
                          placeholder={editingLocationId ? buildings.find(b => b.id === editingLocationId)?.name : "Search & Select Building..."}
                          className="w-full bg-slate-800 border-2 border-slate-700 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
                          value={adminSearchTerm}
                          onFocus={() => setIsAdminDropdownOpen(true)}
                          onChange={(e) => {
                            setAdminSearchTerm(e.target.value);
                            setIsAdminDropdownOpen(true);
                          }}
                        />
                        {editingLocationId && !adminSearchTerm && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-emerald-500/30">SELECTED</span>
                          </div>
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {isAdminDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[1100] max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar ring-8 ring-slate-950/50">
                          {buildings
                            .filter(b => 
                              b.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
                              b.id.includes(adminSearchTerm)
                            )
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((b, idx) => (
                              <button
                                key={b.id}
                                onClick={() => {
                                  setEditingLocationId(b.id);
                                  setAdminSearchTerm('');
                                  setIsAdminDropdownOpen(false);
                                }}
                                className={`w-full text-left p-4 hover:bg-slate-700/50 flex items-center gap-4 transition-colors group/item border-b border-slate-700/50 last:border-0 ${editingLocationId === b.id ? 'bg-emerald-500/10' : ''}`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${editingLocationId === b.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 group-hover/item:bg-slate-600'}`}>
                                  {b.id}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-bold text-sm ${editingLocationId === b.id ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {b.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{b.category}</span>
                                </div>
                                {editingLocationId === b.id && (
                                  <CheckCircle2 className="ml-auto w-4 h-4 text-emerald-500" />
                                )}
                              </button>
                            ))}
                          
                          {buildings.filter(b => b.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) || b.id.includes(adminSearchTerm)).length === 0 && (
                            <div className="p-8 text-center">
                              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm font-bold">No buildings match your search</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Click overlay to close dropdown */}
                      {isAdminDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsAdminDropdownOpen(false)}
                        />
                      )}
                    </div>
                  </div>

                  {editingLocationId && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl text-center animate-in zoom-in-95">
                        <p className="text-white font-black text-sm uppercase mb-3">Target Coordinate</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LAT (X)</p>
                            <p className="text-sm font-mono font-bold text-emerald-400">
                              {locationOverrides[editingLocationId]?.lat?.toFixed(6) || '---'}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LNG (Y)</p>
                            <p className="text-sm font-mono font-bold text-emerald-400">
                              {locationOverrides[editingLocationId]?.lng?.toFixed(6) || '---'}
                            </p>
                          </div>
                        </div>
                        {locationOverrides[editingLocationId] && (
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                            <CheckCircle2 className="w-3 h-3" /> Staged for Sync
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-slate-800/30 p-4 rounded-2xl text-center border border-white/5">
                        <p className="text-slate-400 text-[10px] font-bold">Tap anywhere on the map to <br/> update this entrance location.</p>
                      </div>
                    </div>
                  )}
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

      <BuildingDashboard 
        isOpen={showBuildingDashboard} 
        onClose={() => setShowBuildingDashboard(false)} 
        buildings={buildings}
      />

      {/* 360 Virtual Experience Modal */}
      {activePano && (
        <StreetViewModal 
          building={activePano} 
          onClose={() => setActivePano(null)} 
        />
      )}
    </div>
  );
};

export default MapViewer;
