import React, { useState, useEffect } from 'react';
import { Search, Navigation, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';
import { useGoogleSheets } from './hooks/useGoogleSheets';

function App() {
  const { buildings, settings, loading, error } = useGoogleSheets();
  const [destination, setDestination] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);

  const [kioskLocation, setKioskLocation] = useState({ lat: 43.5309, lng: -80.2285, name: 'Kiosk Station 1' });
  const [locationOverrides, setLocationOverrides] = useState({});
  const [is3D, setIs3D] = useState(false);
  const [activePano, setActivePano] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('kiosk_calibration');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.kiosk) setKioskLocation(data.kiosk);
      if (data.locations) setLocationOverrides(data.locations);
    } else if (settings.kiosk_lat && settings.kiosk_lng) {
      // Fallback to Google Sheets settings if no local calibration exists
      setKioskLocation({ 
        lat: settings.kiosk_lat, 
        lng: settings.kiosk_lng, 
        name: settings.app_title || 'Kiosk Station' 
      });
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-widest">Syncing Data...</h2>
          <p className="text-slate-500 font-bold mt-2">Connecting to Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[48px] text-center max-w-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-widest text-red-500">Connection Error</h2>
          <p className="text-slate-400 font-bold mt-4 mb-8">We couldn't reach the Google Sheets server. Please check your internet connection or the spreadsheet's sharing settings.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar for Search and Info */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        destination={destination}
        setDestination={setDestination}
        routeInfo={routeInfo}
        kioskLocation={kioskLocation}
        locationOverrides={locationOverrides}
        is3D={is3D}
        setIs3D={setIs3D}
        buildings={buildings}
        settings={settings}
        activePano={activePano}
        setActivePano={setActivePano}
      />

      {/* Main Map Area */}
      <main className="flex-1 relative h-full w-full">
        <MapViewer 
          destination={destination} 
          kioskLocation={kioskLocation} 
          setKioskLocation={setKioskLocation}
          locationOverrides={locationOverrides}
          setLocationOverrides={setLocationOverrides}
          onRouteUpdate={setRouteInfo}
          is3D={is3D}
          setIs3D={setIs3D}
          buildings={buildings}
          settings={settings}
          activePano={activePano}
          setActivePano={setActivePano}
        />
      </main>
    </div>
  );
}

export default App;

