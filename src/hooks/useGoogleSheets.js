import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const BUILDINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zCAJ8RgNDkBOajIEg0JB8lCXQiwFCtjTqH0mBw_nrw3qrr-8fvZR7cAGsC0jO47YZ34IMmKI8D1K/pub?gid=2135794203&single=true&output=csv';
const SETTINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zCAJ8RgNDkBOajIEg0JB8lCXQiwFCtjTqH0mBw_nrw3qrr-8fvZR7cAGsC0jO47YZ34IMmKI8D1K/pub?gid=781322042&single=true&output=csv';

export const useGoogleSheets = () => {
  const [buildings, setBuildings] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both CSVs
        const [buildingsRes, settingsRes] = await Promise.all([
          fetch(BUILDINGS_URL),
          fetch(SETTINGS_URL)
        ]);

        const buildingsText = await buildingsRes.text();
        const settingsText = await settingsRes.text();

        // Parse Buildings
        Papa.parse(buildingsText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Ensure numeric values are actually numbers
            const processedBuildings = results.data.map(b => ({
              ...b,
              lat: parseFloat(b.lat),
              lng: parseFloat(b.lng),
              entrances: parseInt(b.entrances) || 0,
              has_360: String(b.has_360).toUpperCase() === 'TRUE',
              svg_width: parseFloat(b.svg_width) || 500,
              svg_rotation: parseFloat(b.svg_rotation) || 0
            }));
            setBuildings(processedBuildings);
          }
        });

        // Parse Settings
        Papa.parse(settingsText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const settingsObj = {};
            results.data.forEach(row => {
              if (row.Key) {
                // Convert boolean-like strings
                let val = row.Value;
                if (val === 'TRUE') val = true;
                if (val === 'FALSE') val = false;
                // Convert numbers
                if (!isNaN(val) && val !== '' && typeof val !== 'boolean') {
                  val = parseFloat(val);
                }
                settingsObj[row.Key] = val;
              }
            });
            setSettings(settingsObj);
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching Google Sheets data:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { buildings, settings, loading, error };
};
