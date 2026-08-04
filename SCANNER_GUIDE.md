# RTU Drawing Archive - Local Image Scanner Guide

This guide explains how to run the local image scanner script (`scripts/scan-local-archive.js`) to automatically index drawings from your local drive (`E:\db_pictures`) into the digital archive application.

---

## 1. Quick Start

### Basic Scan (Default Fallback Mode)
Run the scanner from the project directory:

```bash
npm run scan
```

What this does:
1. Scans `E:\db_pictures` recursively across the root folders (`Architecture`, `Art`, `Exhibitions`).
2. **Validates folder structure** against `studyTasksTree.json` and reports any extra/unrecognized folders or loose images.
3. Automatically maps subfolders to categories and subcategories matching `studyTasksTree.json`.
4. Detects multi-picture projects and groups their images under a single project item (`images: [...]`).
5. Cleans up file names into human-readable titles.
6. Updates `src/data/projects.json`.
7. Streams images directly to your local web app at `http://localhost:5173/rtu-drawing-archive/` via Vite middleware.

---

## 2. Folder Structure Validation (`studyTasksTree.json`)

When you run `npm run scan`, the script automatically compares your hard drive directory hierarchy (`E:\db_pictures`) against `src/data/studyTasksTree.json`.

If any directory structural mistakes are detected, they are printed to the console with their exact file paths and problem explanations:

### Checked Structure Anomalies

1. **Unrecognized Subfolders (`UNRECOGNIZED_SUBFOLDER`):**
   * Occurs when a folder on the hard drive does not exist in `studyTasksTree.json`.
   * **Console Example:**
     ```text
     [UNRECOGNIZED_SUBFOLDER]
     Path:  E:\db_pictures\Architecture\Presentation Drawings\Architect's Design Studio Drawings (Alumni)\Hybrid Visualisations
     Issue: Subfolder "Hybrid Visualisations" under "Architect's Design Studio Drawings (Alumni)" does not match any expected category/subcategory in studyTasksTree.json.
     ```

2. **Loose Images Outside Subcategory Folders (`IMAGE_OUTSIDE_SUBCATEGORY_FOLDER`):**
   * Occurs when image files are placed directly inside a category folder alongside subfolders, instead of inside their respective subcategory folder.
   * **Console Example:**
     ```text
     [IMAGE_OUTSIDE_SUBCATEGORY_FOLDER]
     Path:  E:\db_pictures\Art\Humans in the Environment\Human Scale in Interior\IMG_20260702_194001.jpg
     Issue: Image file "IMG_20260702_194001.jpg" is placed at folder level "Human Scale in Interior" alongside subfolders, instead of inside a specific subcategory folder.
     ```

3. **Loose Images in Archive Root / Keyword Folders:**
   * Flags image files placed directly in `E:\db_pictures\` root or directly under `Architecture/` / `Art/` outside of category folders.

---

## 3. Multi-Picture Projects (Multi-Image Grouping)

Projects that consist of multiple images (e.g. multiple sheets, pages, parts, or views of the same project) are automatically merged into a **single project entry** containing an array of image URLs (`images: ["...", "..."]`), sorted in natural order (sheet 1, 2, ..., 10).

### Methods for Grouping Multi-Picture Projects

#### Method A: Multi-Sheet Filename Patterns (`--pattern`)
Use pattern tokens such as `{sheet}`, `{page}`, `{part}`, `{seq}`, or `{index}`:

```bash
npm run scan -- --pattern="{year}_{author}_{title}_{sheet}"
```

* **Files in folder:**
  * `1995_Kalniņš_Doma Laukums_01.jpg`
  * `1995_Kalniņš_Doma Laukums_02.jpg`
  * `1995_Kalniņš_Doma Laukums_03.jpg`
* **Resulting Project in `projects.json`:**
  * **Title:** `Doma Laukums`
  * **Author:** `Juris Kalniņš` (`p_001`)
  * **Year:** `1995`
  * **Images:** `["/archive-images/.../01.jpg", "/archive-images/.../02.jpg", "/archive-images/.../03.jpg"]`

#### Method B: Automatic Fallback Grouping (No Pattern)
Even without specifying a pattern, the scanner automatically detects sheet/page suffixes at the end of filenames (such as `_01`, `_02`, `-1`, `-2`, `_p1`, `_p2`, `_sheet1`, ` (1)`, ` (2)`):

* **Files:** `facade_study_1.jpg`, `facade_study_2.jpg`
* **Grouped Title:** `facade study`
* **Result:** 1 Project entry with both images.

#### Method C: Folder-Level `info.json` (`singleProject: true`)
If an entire folder represents a single project with multiple images, place an `info.json` file inside that folder:

`E:\db_pictures\Architecture\Presentation Drawings\Album1\info.json`:
```json
{
  "title": "Diploma Album 1995",
  "description": "Full presentation booklet",
  "singleProject": true
}
```
All images in that folder will be grouped under this single project entry.

---

## 4. Setting a Custom Archive Folder Path

By default, the script scans `E:/db_pictures`. If your images are located on another drive or folder, pass the path via the `ARCHIVE_IMAGES_PATH` environment variable:

#### On Windows (PowerShell):
```powershell
$env:ARCHIVE_IMAGES_PATH="D:\my_drawings"; npm run scan
```

#### On Windows (CMD):
```cmd
set ARCHIVE_IMAGES_PATH=D:\my_drawings && npm run scan
```

---

## 5. Applying Filename Patterns (`--pattern`)

If your files follow a consistent naming format, pass a `--pattern` argument so the script automatically extracts metadata (year, author, title, category, subcategory, sheet/page) directly from filenames.

### CLI Syntax
```bash
npm run scan -- --pattern="<PATTERN>"
```

---

### Pattern Template Tokens

| Token | Description | Example Matched Input | Extracted Field |
| :--- | :--- | :--- | :--- |
| `{year}` | 4-digit year (or number) | `1995` | `year: 1995`, `decade: 1990` |
| `{author}` | Author last name, first name, or ID | `Kalniņš` or `p_001` | Matches `people.json` -> `authorId: "p_001"` |
| `{title}` | Title of the project/drawing | `Site Plan Study` | `title: "Site Plan Study"` |
| `{category}` | Custom category override | `Presentation Drawings` | `category: "Presentation Drawings"` |
| `{subcategory}` | Custom subcategory override | `Site Plans` | `subcategory: "Site Plans"` |
| `{sheet}` / `{page}` | Sheet/page/part sequence index | `01`, `p1`, `sheet2` | Natural image order in project |

---

### Common Pattern Examples

#### Example 1: `{year}_{author}_{title}_{sheet}`
```bash
npm run scan -- --pattern="{year}_{author}_{title}_{sheet}"
```
* **Filename:** `1995_Kalniņš_Doma Laukums_01.jpg`
* **Extracted Metadata:**
  * **Year:** `1995`
  * **Decade:** `1990`
  * **Author:** `Juris Kalniņš` (ID `p_001`)
  * **Title:** `Doma Laukums`
  * **Sheet:** `01`

---

## 6. Folder-Level Overrides (`info.json`)

You can place an `info.json` file inside any specific folder in your archive to provide metadata overrides or directory-specific file patterns:

`E:\db_pictures\Architecture\Presentation Drawings\info.json`:
```json
{
  "title": "Default Album Title",
  "description": "Collection of diploma final presentations from 1990-2000",
  "authorId": "p_001",
  "year": 1995,
  "filePattern": "{year}_{title}_{sheet}"
}
```

If `info.json` exists in a folder, its metadata values and file pattern will automatically take precedence for all files in that directory.

---

## 7. Automatic Fallback Behavior

If a filename pattern is configured but an individual file does not match the pattern (e.g. `IMG_20260219_114811.jpg`), **the scanner does not crash or skip the file**. 

Instead, it falls back to standard extraction:
1. Cleans up the filename to form a readable title.
2. Strips sheet/page suffixes (`_1`, `_02`, `-p1`) to group multi-picture files together.
3. Scans for any 4-digit year in the file path or uses the default year (`2020`).
4. Uses the folder structure to resolve `keyword`, `category`, and `subcategory`.

---

## 8. Workflow Summary

1. Add or organize your images inside `E:\db_pictures\`.
2. Run `npm run scan` (or `npm run scan -- --pattern="..."`).
3. Check the console output for any **Folder Structure Validation** warnings.
4. Start or view your web app (`npm run dev`).
5. Browse all updated drawings and multi-picture project carousels/galleries instantly!
