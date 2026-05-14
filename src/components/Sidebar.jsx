import React, { useState } from 'react';
import { Search, Navigation, MapPin, Building, Utensils, BookOpen, X, ChevronLeft, ChevronRight, Settings, Dumbbell } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  destination, 
  setDestination, 
  routeInfo, 
  kioskLocation, 
  locationOverrides = {}, 
  is3D, 
  setIs3D, 
  buildings = [], 
  settings = {},
  activePano,
  setActivePano
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'academic': return BookOpen;
      case 'residence': return Building;
      case 'services': return Utensils;
      case 'athletics': return Dumbbell;
      case 'admin': return Settings;
      default: return MapPin;
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0 && destination) {
      setDestination(null);
    }
  };

  const filteredLocations = buildings.map(loc => {
    const override = locationOverrides[loc.id];
    if (override) {
      return { ...loc, lat: override.lat, lng: override.lng };
    }
    return loc;
  }).filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(loc.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate Google Maps URL for Mobile Handoff
  const mobileUrl = destination 
    ? `https://www.google.com/maps/dir/?api=1&origin=${kioskLocation.lat},${kioskLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=walking`
    : '';

  return (
    <div 
      className={`relative transition-all duration-300 ease-in-out flex flex-col bg-slate-900 border-r border-slate-800 ${isOpen ? 'w-1/4 min-w-[450px]' : 'w-0'}`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-16 top-8 bg-slate-800 p-4 rounded-r-2xl border-y border-r border-slate-700 hover:bg-slate-700 transition-colors z-50 shadow-xl"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <ChevronLeft className="w-8 h-8" /> : <ChevronRight className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden p-8">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold mb-3 tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {settings.app_title || 'Campus Wayfinder'}
            </h1>
            <p className="text-xl text-slate-400 font-medium">
              {settings.app_subtitle || 'Explore the campus with ease.'}
            </p>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-20 pr-6 py-7 bg-slate-800/80 border-2 border-slate-700 rounded-3xl text-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/40 focus:border-primary transition-all shadow-2xl backdrop-blur-sm"
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {destination && !searchTerm ? (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-4xl font-bold mb-3 text-white leading-tight">{destination.name}</h2>
                      <span className="inline-flex items-center px-5 py-2 rounded-full text-lg font-bold bg-primary/20 text-primary uppercase tracking-widest border border-primary/30">
                        {destination.category}
                      </span>
                    </div>
                    <button onClick={() => {
                      setDestination(null);
                      if (setIs3D) setIs3D(false);
                    }} className="p-3 bg-slate-700 rounded-2xl hover:bg-slate-600 transition-colors">
                      <X className="w-8 h-8" />
                    </button>
                  </div>

                  {destination.description && (
                    <p className="text-slate-300 text-xl mb-8 leading-relaxed italic">
                      "{destination.description}"
                    </p>
                  )}
                  
                  {routeInfo && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">WALK TIME</p>
                        <p className="text-3xl font-black text-white">{routeInfo.duration}</p>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">DISTANCE</p>
                        <p className="text-3xl font-black text-white">{routeInfo.distance}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <button onClick={() => setIs3D(true)} className="w-full bg-primary hover:bg-red-600 text-white font-black py-7 px-8 rounded-2xl text-3xl flex items-center justify-center gap-4 transition-all shadow-xl">
                      <Navigation className="w-10 h-10" />
                      START NAVIGATION
                    </button>

                    {settings.streetview_on && destination.has_360 && (
                      <button 
                        onClick={() => setActivePano(destination)}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-5 px-8 rounded-2xl text-xl flex items-center justify-center gap-4 transition-all border border-white/10"
                      >
                        <Building className="w-8 h-8 text-blue-400" />
                        VIEW 360° TOUR
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Handoff QR Section */}
                <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/30 text-center">
                  <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Take it with you</h3>
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mb-6">
                    <QRCodeSVG value={mobileUrl} size={200} level="H" />
                  </div>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Scan this QR code to continue <br/>
                    this route on your phone
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-500 uppercase tracking-[0.2em] pl-4 mb-6">Available Locations</h3>
                {filteredLocations.map(loc => {
                  const Icon = getIcon(loc.category);
                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setDestination(loc);
                        setSearchTerm('');
                        if (setIs3D) setIs3D(false);
                      }}
                      className="w-full text-left bg-slate-800/40 hover:bg-slate-800 p-7 rounded-3xl border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-6 group relative overflow-hidden"
                    >
                      <div className="bg-slate-700 p-5 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <Icon className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-slate-200 group-hover:text-white transition-colors">{loc.name}</h4>
                        <p className="text-lg text-slate-500 group-hover:text-slate-400 capitalize">{loc.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;


