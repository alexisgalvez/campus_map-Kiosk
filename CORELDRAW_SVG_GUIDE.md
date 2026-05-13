# CorelDraw to Wayfinding SVG Guide

Follow these instructions to create a high-precision, interactive campus map that integrates perfectly with your React app.

---

## 1. Setup Your Base Layer
1. **Import your high-res screenshot** (The 3000x3000px capture we made).
2. **Lock the layer:** In the **Object Manager** (`Window > Dockers > Objects`), click the lock icon next to the layer containing the screenshot. This prevents you from accidentally moving it while tracing.
3. **Create a new layer:** Call it "Buildings".

---

## 2. Tracing & Naming (The "Smart" Part)
For the app to recognize your shapes, the **Object Name** in CorelDraw must match the **ID** in our code.

1. **Trace the footprint:** Use the **Pen** or **Bézier** tool to draw the outline of a building.
2. **Name the Object:**
   - Go to the **Object Manager** docker.
   - You will see your new shape (usually called "Curve").
   - **Right-click** it and select **Rename**.
   - Type the ID from the app list (see below).

### Naming Convention:
| Building Name | CorelDraw Object Name |
| :--- | :--- |
| Animal Science | `bld-101` |
| Alexander Hall | `bld-102` |
| Crop Science | `bld-103` |
| Johnston Hall | `bld-301` |
| University Centre | `bld-404` |

> [!TIP]
> **Why do this?** When the app loads the SVG, it looks for these IDs. If a user clicks a shape named `bld-101`, the app automatically knows to show the "Animal Science" information.

---

## 3. Exporting the SVG for Web
When your tracing is finished, use these specific settings to ensure the IDs are preserved:

1. Go to **File > Export**.
2. Choose **SVG - Scalable Vector Graphics**.
3. In the **SVG Export Dialog**, use these settings:
   - **Object Names:** Set this to **ID**. (This is the most important step!)
   - **Styling:** Set to **Internal CSS**.
   - **Fountain Steps:** 256.
   - **Precision:** 1 to 3 decimal places.
4. Click **OK**.

---

## 4. Verification
To check if you did it right:
1. Open your exported `.svg` file in **Notepad** or **VS Code**.
2. Look for your IDs. You should see something like:
   `<path id="bld-101" d="..." />`
3. If you see `id="path123"`, the export didn't catch your CorelDraw names. Double-check the "Object Names: ID" setting in the export dialog.

---

## 5. Next Steps
Once you have the SVG:
1. Upload it here.
2. I will replace the "Layered Map" with your **Smart SVG**.
3. I will align it using two anchor points so it sits perfectly on the Google Map.
