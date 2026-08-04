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
2. Automatically maps subfolders to categories and subcategories matching `studyTasksTree.json`.
3. Detects multi-picture projects and groups their images under a single project item (`images: [...]`).
4. Cleans up file names into human-readable titles.
5. Updates `src/data/projects.json`.
6. Streams images directly to your local web app at `http://localhost:5173/rtu-drawing-archive/` via Vite middleware.

---

## 2. Multi-Picture Projects (Multi-Image Grouping)

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

## 3. Setting a Custom Archive Folder Path

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

## 4. Applying Filename Patterns (`--pattern`)

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

#### Example 2: `{year}_{title}_p{page}`
```bash
npm run scan -- --pattern="{year}_{title}_p{page}"
```
* **Filename:** `1923_Bockslaff Facade Proposal_p1.jpg`
* **Extracted Metadata:**
  * **Year:** `1923`
  * **Title:** `Bockslaff Facade Proposal`
  * **Page:** `1`

#### Example 3: `{author}-{year}-{title}`
```bash
npm run scan -- --pattern="{author}-{year}-{title}"
```
* **Filename:** `Eglīte-2005-Sculpture Study.png`
* **Extracted Metadata:**
  * **Author:** `Līga Eglīte` (ID `p_002`)
  * **Year:** `2005`
  * **Title:** `Sculpture Study`

---

### Using Regular Expression Patterns

For complex filename structures, pass a full Regular Expression wrapped in `/.../i`:

```bash
npm run scan -- --pattern="/^(?<year>\d{4})_(?<author>[^_]+)_(?<title>.+)_(?<sheet>\d+)$/i"
```

The script reads named capture groups (`?<year>`, `?<author>`, `?<title>`, `?<category>`, `?<subcategory>`, `?<sheet>`, `?<page>`, `?<part>`, `?<seq>`, `?<index>`).

---

## 5. Folder-Level Overrides (`info.json`)

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

## 6. Automatic Fallback Behavior

If a filename pattern is configured but an individual file does not match the pattern (e.g. `IMG_20260219_114811.jpg`), **the scanner does not crash or skip the file**. 

Instead, it falls back to standard extraction:
1. Cleans up the filename to form a readable title.
2. Strips sheet/page suffixes (`_1`, `_02`, `-p1`) to group multi-picture files together.
3. Scans for any 4-digit year in the file path or uses the default year (`2020`).
4. Uses the folder structure to resolve `keyword`, `category`, and `subcategory`.

---

## 7. Workflow Summary

1. Add or organize your images inside `E:\db_pictures\`.
2. Run `npm run scan` (or `npm run scan -- --pattern="..."`).
3. Start or view your web app (`npm run dev`).
4. Browse all updated drawings and multi-picture project carousels/galleries instantly!
