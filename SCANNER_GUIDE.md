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
1. Scans `E:\db_pictures` recursively across the 3 root folders (`Architecture`, `Art`, `Exhibitions`).
2. Automatically maps subfolders to categories and subcategories matching `studyTasksTree.json`.
3. Cleans up file names into human-readable titles.
4. Updates `src/data/projects.json`.
5. Streams images directly to your local web app at `http://localhost:5173/rtu-drawing-archive/` via Vite middleware.

---

## 2. Setting a Custom Archive Folder Path

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

## 3. Applying Filename Patterns (`--pattern`)

If your files follow a consistent naming format, you can pass a `--pattern` argument so the script automatically extracts metadata (such as year, author, title, category, and subcategory) directly from filenames.

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
| `{title}` | Title of the drawing | `Site Plan Study` | `title: "Site Plan Study"` |
| `{category}` | Custom category override | `Presentation Drawings` | `category: "Presentation Drawings"` |
| `{subcategory}` | Custom subcategory override | `Site Plans` | `subcategory: "Site Plans"` |

---

### Common Pattern Examples

#### Example 1: `{year}_{author}_{title}`
```bash
npm run scan -- --pattern="{year}_{author}_{title}"
```
* **Filename:** `1995_Kalniņš_Doma Laukums.jpg`
* **Extracted Metadata:**
  * **Year:** `1995`
  * **Decade:** `1990`
  * **Author:** `Juris Kalniņš` (ID `p_001`)
  * **Title:** `Doma Laukums`

#### Example 2: `{year}_{title}`
```bash
npm run scan -- --pattern="{year}_{title}"
```
* **Filename:** `1923_Bockslaff Facade Proposal.jpg`
* **Extracted Metadata:**
  * **Year:** `1923`
  * **Decade:** `1920`
  * **Title:** `Bockslaff Facade Proposal`

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
npm run scan -- --pattern="/^(?<year>\d{4})_(?<author>[^_]+)_(?<title>.+)$/i"
```

The script reads named capture groups (`?<year>`, `?<author>`, `?<title>`, `?<category>`, `?<subcategory>`).

---

## 4. Folder-Level Overrides (`info.json`)

You can place an `info.json` file inside any specific folder in your archive to provide metadata overrides or directory-specific file patterns:

`E:\db_pictures\Architecture\Presentation Drawings\info.json`:
```json
{
  "title": "Default Album Title",
  "description": "Collection of diploma final presentations from 1990-2000",
  "authorId": "p_001",
  "year": 1995,
  "filePattern": "{year}_{title}"
}
```

If `info.json` exists in a folder, its metadata values and file pattern will automatically take precedence for all files in that directory.

---

## 5. Automatic Fallback Behavior

If a filename pattern is configured but an individual file does not match the pattern (e.g. `IMG_20260219_114811.jpg`), **the scanner does not crash or skip the file**. 

Instead, it falls back to standard extraction:
1. Cleans up the filename to form a readable title.
2. Scans for any 4-digit year in the file path or uses the current default year (`2020`).
3. Uses the folder structure to resolve `keyword`, `category`, and `subcategory`.

---

## 6. Workflow Summary

1. Add or organize your images inside `E:\db_pictures\`.
2. Run `npm run scan` (or `npm run scan -- --pattern="..."`).
3. Start or view your web app (`npm run dev`).
4. Browse all updated drawings instantly!
