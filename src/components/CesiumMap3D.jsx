import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

const CesiumMap3D = ({ apiKey, destination, kioskLocation, routePath }) => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const pathEntityRef = useRef(null);
  const pinEntityRef = useRef(null);
  const orbitListenerRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const isIdleRef = useRef(false);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Initialize the Cesium Viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: true,
      requestRenderMode: true, // Only render when camera moves or something changes
      maximumRenderTimeChange: Infinity,
      msaaSamples: 1, // Reduce anti-aliasing for better performance
    });
    
    // Performance: Slightly lower resolution scale for a significant speed boost
    viewer.resolutionScale = 0.9;
    
    // Performance: Disable expensive lighting features
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = false;
    viewer.shadows = false; 
    
    // CRITICAL: Disable collision detection so camera doesn't pop out to space
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    viewer.scene.globe.show = false;
    viewerRef.current = viewer;

    const initTileset = async () => {
      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset({
          key: apiKey,
        });
        
        // Performance: Adjust tileset detail level (higher = faster, lower quality)
        tileset.maximumScreenSpaceError = 32; // Standard is 16
        tileset.maximumMemoryUsage = 512; // Limit memory to 512MB
        
        viewer.scene.primitives.add(tileset);
        
        // After tileset is added, set camera again to be sure
        if (kioskLocation) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(kioskLocation.lng, kioskLocation.lat, 330 + 150),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-35),
              roll: 0.0
            }
          });
        }
      } catch (e) {
        console.error('Error loading Google 3D Tiles:', e);
      }
    };
    initTileset();

    // Immediate camera set
    if (kioskLocation) {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(kioskLocation.lng, kioskLocation.lat, 330 + 150),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0.0
        }
      });
    }

    // ... (Idle/Orbit logic remains)

    return () => {
      // ... (Cleanup remains)
    };
  }, [apiKey]);

  // Handle Fly-To destination and Markers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clean up existing markers
    if (pinEntityRef.current) {
      if (Array.isArray(pinEntityRef.current)) {
        pinEntityRef.current.forEach(e => viewer.entities.remove(e));
      } else {
        viewer.entities.remove(pinEntityRef.current);
      }
      pinEntityRef.current = null;
    }

    const existingKioskPin = viewer.entities.getById('kiosk-pin');
    if (existingKioskPin) viewer.entities.remove(existingKioskPin);

    if (destination && kioskLocation) {
      const kLng = Number(kioskLocation.lng);
      const kLat = Number(kioskLocation.lat);
      const dLng = Number(destination.lng);
      const dLat = Number(destination.lat);

      const midLng = (kLng + dLng) / 2;
      const midLat = (kLat + dLat) / 2;

      // Set view instantly (no duration = no fly animation)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(midLng, midLat, 330 + 180),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0.0
        }
      });

      // 1. Kiosk Marker (YOU ARE HERE)
      const kioskMarker = viewer.entities.add({
        id: 'kiosk-pin',
        position: Cesium.Cartesian3.fromDegrees(kLng, kLat),
        billboard: {
          image: 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png',
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          width: 54,
          height: 54,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: 'YOU ARE HERE',
          font: '900 22px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -60),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: new Cesium.Color(0.06, 0.09, 0.16, 0.9),
          backgroundPadding: new Cesium.Cartesian2(12, 8),
        }
      });

      // 2. Destination Marker
      const destMarker = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(dLng, dLat),
        billboard: {
          image: 'https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png',
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          width: 54,
          height: 54,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: destination.name.toUpperCase(),
          font: '900 22px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#1e40af'),
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -60),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: new Cesium.Color(0.0, 0.1, 0.4, 0.9),
          backgroundPadding: new Cesium.Cartesian2(12, 8),
        }
      });

      pinEntityRef.current = [kioskMarker, destMarker];

    } else if (kioskLocation) {
      // Set view instantly
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(kioskLocation.lng, kioskLocation.lat, 330 + 150),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-35),
          roll: 0.0
        }
      });

      const kioskMarker = viewer.entities.add({
        id: 'kiosk-pin',
        position: Cesium.Cartesian3.fromDegrees(kioskLocation.lng, kioskLocation.lat),
        billboard: {
          image: 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png',
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          width: 54,
          height: 54,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: 'YOU ARE HERE',
          font: '900 22px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -60),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: new Cesium.Color(0.06, 0.09, 0.16, 0.9),
          backgroundPadding: new Cesium.Cartesian2(12, 8),
        }
      });
      pinEntityRef.current = [kioskMarker];
    }
    
    // Force a render after updating entities
    viewer.scene.requestRender();
  }, [destination, kioskLocation]);

  // Handle Route Path - SOLID RED GLOW (matching reference)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (pathEntityRef.current) {
      if (Array.isArray(pathEntityRef.current)) {
        pathEntityRef.current.forEach(e => viewer.entities.remove(e));
      } else {
        viewer.entities.remove(pathEntityRef.current);
      }
      pathEntityRef.current = null;
    }

    if (routePath && routePath.length > 0) {
      const positions = routePath.map(p => Cesium.Cartesian3.fromDegrees(p.lng(), p.lat()));
      
      const mainPath = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 20, // Slightly wider to compensate for no glow
          material: Cesium.Color.fromCssColorString('#ef4444'), // Red 500
          clampToGround: true,
          zIndex: 10
        }
      });

      pathEntityRef.current = [mainPath];
    }
    
    // Force a render after updating path
    viewer.scene.requestRender();
  }, [routePath]);

  return <div ref={cesiumContainer} className="w-full h-full" />;
};

export default CesiumMap3D;
