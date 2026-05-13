# Google Sheets Data Sync Guide

This guide explains how to connect your campus building data to a Google Sheet so you can update the kiosk instantly without writing code.

---

## 1. Setup Your Spreadsheet
1. Create a new **Google Sheet**.
2. Set up the **Header Row** (Row 1) with these exact names:
   - `id` (The building ID, e.g., 101)
   - `name` (The building name, e.g., Animal Science)
   - `category` (academic, residence, services, or admin)
   - `lat` (Latitude coordinate)
   - `lng` (Longitude coordinate)
   - `entrances` (Number of entrances)
3. Fill in your building data. 

> [!IMPORTANT]
> The `id` in your sheet MUST match the `id` you use in your CorelDraw SVG (e.g., if the sheet says `id` is `101`, the CorelDraw shape must be `bld-101`).

---

## 2. Publish as CSV
To allow the kiosk to read your data, you must publish it to the web:

1. In Google Sheets, go to **File > Share > Publish to web**.
2. Change the settings from "Entire Document" to your specific sheet name (e.g., "Sheet1").
3. Change "Web Page" to **Comma-separated values (.csv)**.
4. Click **Publish**.
5. **Copy the URL** provided. It should look something like this:
   `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`

---

## 3. Connect to the Kiosk
Once you have the link:
1. Provide the link to your AI Assistant.
2. I will update the `MapViewer.jsx` to fetch this URL every time the app starts.
3. Your changes in the Sheet will reflect on the Kiosk after a refresh!

---

## 4. Troubleshooting
- **Data not showing?** Make sure you didn't leave any empty rows at the top.
- **Coordinates wrong?** Ensure you are using decimal coordinates (e.g., `43.5305`) and not degrees/minutes/seconds.
- **Auto-Sync:** Google Sheets usually takes about 1-5 minutes to push your changes to the public CSV link after you edit a cell.
