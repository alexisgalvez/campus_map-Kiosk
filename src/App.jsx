import React, { useState, useEffect } from 'react';
import { Search, Navigation, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';

function App() {
  const [destination, setDestination] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  // Kiosk Location (persisted in localStorage)
  const [kioskLocation, setKioskLocation] = useState(() => {
    const saved = localStorage.getItem('kiosk_location');
    return saved ? JSON.parse(saved) : { lat: 43.5309, lng: -80.2285, name: 'Kiosk Station 1' };
  });

  // Persist kiosk location when it changes
  useEffect(() => {
    localStorage.setItem('kiosk_location', JSON.stringify(kioskLocation));
  }, [kioskLocation]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar for Search and Info */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        destination={destination}
        setDestination={setDestination}
        isCalibrating={isCalibrating}
        setIsCalibrating={setIsCalibrating}
        routeInfo={routeInfo}
        kioskLocation={kioskLocation}
      />

      {/* Main Map Area */}
      <main className="flex-1 relative h-full w-full">
        <MapViewer 
          destination={destination} 
          kioskLocation={kioskLocation} 
          setKioskLocation={setKioskLocation}
          isCalibrating={isCalibrating}
          onRouteUpdate={setRouteInfo}
        />
        
        {/* Calibration HUD */}
        {isCalibrating && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-amber-500 text-black px-8 py-4 rounded-full font-black text-2xl shadow-2xl flex items-center gap-4 border-4 border-white">
              <MapPin className="w-8 h-8" />
              TAP THE MAP TO SET KIOSK LOCATION
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
