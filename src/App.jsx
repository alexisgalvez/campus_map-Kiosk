import React, { useState, useEffect } from 'react';
import { Search, Navigation, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';

function App() {
  const [destination, setDestination] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);

  const [kioskLocation, setKioskLocation] = useState({ lat: 43.5309, lng: -80.2285, name: 'Kiosk Station 1' });
  const [locationOverrides, setLocationOverrides] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('kiosk_calibration');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.kiosk) setKioskLocation(data.kiosk);
      if (data.locations) setLocationOverrides(data.locations);
    }
  }, []);

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
        />
        

      </main>
    </div>
  );
}

export default App;
