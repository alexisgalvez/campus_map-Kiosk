# Campus Wayfinding - Google Sheets Schema Guide

Use this guide to set up your Google Spreadsheet. For best results, create two separate tabs (sheets) in your document.

---

## Tab 1: `Buildings`
This tab contains the data for every interactive building on the map.

| Column Header | Description | Example |
| :--- | :--- | :--- |
| **id** | MUST match the CorelDraw SVG ID (e.g., `101`) | `101` |
| **name** | The display name of the building | `Animal Science` |
| **category** | used for filtering (academic, residence, services) | `academic` |
| **lat** | Latitude coordinate (Decimal) | `43.5305` |
| **lng** | Longitude coordinate (Decimal) | `-80.2290` |
| **entrances** | Number of entrances (shown in dashboard) | `2` |
| **description** | The text shown in the **Tooltip** | `Home to research labs.` |
| **has_360** | Set to `TRUE` to enable the 360° button | `TRUE` |
| **pano_lat** | (Optional) Exact lat for Street View | `43.5306` |
| **pano_lng** | (Optional) Exact lng for Street View | `-80.2291` |
| **pano_heading**| (Optional) Camera direction (0-360) | `180` |

---

## Tab 2: `KioskSettings`
This tab controls the "Global" look and feel of the app.

| Key | Value | Description |
| :--- | :--- | :--- |
| **app_title** | `Guelph Wayfinder` | Main heading in the sidebar |
| **app_subtitle** | `Explore with ease` | Subheading text |
| **admin_pin** | `0307` | PIN for the Calibration Suite |
| **idle_timeout** | `60` | Seconds before app resets |
| **overlay_lat** | `43.5309` | Center of your SVG map |
| **overlay_lng** | `-80.2285` | Center of your SVG map |
| **overlay_width** | `2500` | Scale of the SVG overlay |
| **overlay_rotation**| `-48` | Rotation angle of the SVG |
| **kiosk_lat** | `43.5309` | Where the "You are Here" pin sits |
| **kiosk_lng** | `-80.2285` | Where the "You are Here" pin sits |
| **primary_color** | `#e62b1e` | Main branding color (Hex) |
| **tooltips_enabled**| `TRUE` | Global toggle for tooltips |
| **streetview_on** | `TRUE` | Global toggle for 360° views |

---

## Important Publishing Instructions
1. In Google Sheets, go to **File > Share > Publish to web**.
2. **Publish each tab separately**:
   - Link 1: Select `Buildings` + `Comma-separated values (.csv)`
   - Link 2: Select `KioskSettings` + `Comma-separated values (.csv)`
3. Copy both links and provide them to the AI Assistant.
