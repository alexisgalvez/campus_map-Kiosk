# Google Sheets Data Sync Guide

This guide explains how to connect your campus building data to a Google Sheet so you can update the kiosk instantly without writing code.

---

## 1. Setup Your Spreadsheet
1. Create a new **Google Sheet**.
2. Create two tabs (sheets) at the bottom: `Buildings` and `KioskSettings`.

### **Quick Setup (Copy & Paste Headers)**
To save time, you can copy the following lines and paste them into cell **A1** of each tab. Google Sheets will automatically split them into columns.

**For the `Buildings` tab (Row 1):**
`id	name	category	lat	lng	entrances	description	has_360	pano_lat	pano_lng	pano_heading`

**For the `KioskSettings` tab (Row 1):**
`Key	Value	Description`

---

## 2. Fill in Your Data
### **Buildings Tab**
- `id`: Must match CorelDraw (e.g., `101`).
- `category`: academic, residence, services, or admin.
- `description`: Text for the building tooltip.
- `has_360`: Set to `TRUE` to enable the 360° Panorama button.

### **KioskSettings Tab**
Use this for global app settings like `app_title`, `admin_pin`, and map calibration (`overlay_rotation`, `overlay_width`).

---

## 3. Publish as CSV
To allow the kiosk to read your data, you must publish **each tab** separately:

1. In Google Sheets, go to **File > Share > Publish to web**.
2. **Tab 1:** Select `Buildings` from the dropdown.
3. Change "Web Page" to **Comma-separated values (.csv)**.
4. Click **Publish** and copy the URL.
5. **Tab 2:** Repeat the process for the `KioskSettings` tab and copy that URL as well.

---

## 4. Connect to the Kiosk
1. Provide both CSV links to your AI Assistant.
2. I will update the application to fetch both sheets dynamically.
3. Your changes in the Sheet will reflect on the Kiosk after a refresh!

---

## 5. Troubleshooting
- **Data not showing?** Ensure you published as **CSV**, not a Web Page.
- **Auto-Sync:** Google Sheets usually takes 1-5 minutes to update the public link after you edit a cell.

