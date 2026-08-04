import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const SCAN_DIR = process.env.ARCHIVE_IMAGES_PATH || 'E:/db_pictures'
const OUTPUT_FILE = path.join(ROOT_DIR, 'src/data/projects.json')
const TREE_FILE = path.join(ROOT_DIR, 'src/data/studyTasksTree.json')
const PEOPLE_FILE = path.join(ROOT_DIR, 'src/data/people.json')

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.svg'])

// Load studyTasksTree to match category and subcategory names accurately
let studyTasksTree = null
if (fs.existsSync(TREE_FILE)) {
  try {
    studyTasksTree = JSON.parse(fs.readFileSync(TREE_FILE, 'utf-8'))
  } catch (err) {
    console.warn('Could not parse studyTasksTree.json:', err.message)
  }
}

// Load people list for author matching
let peopleList = []
if (fs.existsSync(PEOPLE_FILE)) {
  try {
    peopleList = JSON.parse(fs.readFileSync(PEOPLE_FILE, 'utf-8'))
  } catch (err) {
    console.warn('Could not parse people.json:', err.message)
  }
}

function cleanTitle(filename) {
  const nameWithoutExt = path.parse(filename).name
  return nameWithoutExt
    .replace(/^[0-9_\-]+/, '')
    .replace(/[_\-]+/g, ' ')
    .trim() || nameWithoutExt
}

function extractBaseTitleAndSheet(text) {
  if (!text) return { baseTitle: '', sheetId: null }
  let titleStr = text
  if (titleStr.includes('.')) {
    titleStr = path.parse(titleStr).name
  }

  // 1. Suffixes with delimiters or keywords:
  // e.g. _01, _002, -1, -02, _p1, _p2, _page1, _sheet1, _part1, (1), (2)
  const delimRegex = /^(.*?)(?:[_\-\s]+(?:p|page|sheet|part|seq|index)?\(?(\d+|[a-zA-Z])\)?|\((\d+)\))$/i
  const delimMatch = titleStr.match(delimRegex)

  if (delimMatch) {
    const rawBase = delimMatch[1].trim()
    const sheetNum = delimMatch[2] || delimMatch[3]
    if (rawBase && sheetNum) {
      return {
        baseTitle: cleanTitle(rawBase),
        sheetId: sheetNum
      }
    }
  }

  // 2. Trailing digits attached to word, e.g. SitePlan01, Drawing1
  const attachedRegex = /^(.*?[a-zA-ZĀ-žа-яА-Я])(\d{1,3})$/i
  const attachedMatch = titleStr.match(attachedRegex)
  if (attachedMatch) {
    const rawBase = attachedMatch[1].trim()
    const sheetNum = attachedMatch[2]
    if (rawBase && sheetNum) {
      return {
        baseTitle: cleanTitle(rawBase),
        sheetId: sheetNum
      }
    }
  }

  return {
    baseTitle: cleanTitle(titleStr),
    sheetId: null
  }
}

function extractYear(text) {
  const match = text.match(/\b(18\d{2}|19\d{2}|20[0-2]\d)\b/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

function findNodeTitleInTree(rootNode, targetTitleLower) {
  if (!rootNode) return null
  if (rootNode.title && rootNode.title.toLowerCase() === targetTitleLower) {
    return rootNode.title
  }
  if (rootNode.children) {
    for (const child of rootNode.children) {
      const found = findNodeTitleInTree(child, targetTitleLower)
      if (found) return found
    }
  }
  return null
}

function getPatternArg() {
  const envPattern = process.env.FILE_PATTERN || process.env.PATTERN
  if (envPattern) return envPattern

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg.startsWith('--pattern=')) {
      return arg.split('=').slice(1).join('=')
    }
    if ((arg === '--pattern' || arg === '-p') && process.argv[i + 1]) {
      return process.argv[i + 1]
    }
  }
  return null
}

function parsePattern(patternStr) {
  if (!patternStr) return null
  patternStr = patternStr.trim()
  if (!patternStr) return null

  // If pattern is a raw regex string like /^(?<year>\d{4})_(?<title>.+)$/i
  if (patternStr.startsWith('/') && patternStr.lastIndexOf('/') > 0) {
    const lastSlashIdx = patternStr.lastIndexOf('/')
    const body = patternStr.slice(1, lastSlashIdx)
    const flags = patternStr.slice(lastSlashIdx + 1) || 'i'
    try {
      return new RegExp(body, flags)
    } catch (e) {
      console.warn(`Invalid regex pattern: ${patternStr}`)
      return null
    }
  }

  // Convert template tokens like {year}, {author}, {title}, {category}, {subcategory}, {sheet}, {page}, {part}, {seq}, {index}
  let regexStr = patternStr
    .replace(/([.*+?^${}()|[\]\\])/g, (match, char) => {
      if (char === '{' || char === '}') return char
      return '\\' + char
    })
    .replace(/\{year\}/gi, '(?<year>\\d{4}|\\d+)')
    .replace(/\{author\}/gi, '(?<author>[^_\\-]+)')
    .replace(/\{authorId\}/gi, '(?<authorId>[^_\\-]+)')
    .replace(/\{title\}/gi, '(?<title>.+)')
    .replace(/\{category\}/gi, '(?<category>[^_\\-]+)')
    .replace(/\{subcategory\}/gi, '(?<subcategory>[^_\\-]+)')
    .replace(/\{sheet\}/gi, '(?<sheet>[^_\\-]+)')
    .replace(/\{page\}/gi, '(?<page>[^_\\-]+)')
    .replace(/\{part\}/gi, '(?<part>[^_\\-]+)')
    .replace(/\{seq\}/gi, '(?<seq>[^_\\-]+)')
    .replace(/\{index\}/gi, '(?<index>[^_\\-]+)')

  try {
    return new RegExp(`^${regexStr}$`, 'i')
  } catch (e) {
    console.warn(`Could not compile pattern "${patternStr}" to RegExp:`, e.message)
    return null
  }
}

function findAuthorId(authorStr, peopleList, defaultAuthor) {
  if (!authorStr) return defaultAuthor
  const cleanStr = authorStr.trim().toLowerCase()

  const idMatch = peopleList.find(p => p.id.toLowerCase() === cleanStr)
  if (idMatch) return idMatch.id

  const nameMatch = peopleList.find(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
    const revFullName = `${p.lastName} ${p.firstName}`.toLowerCase()
    return (
      p.lastName.toLowerCase() === cleanStr ||
      p.firstName.toLowerCase() === cleanStr ||
      fullName.includes(cleanStr) ||
      revFullName.includes(cleanStr)
    )
  })

  if (nameMatch) return nameMatch.id
  return defaultAuthor
}

/**
 * Validates local directory structure against studyTasksTree.json
 * Reports unrecognized folders and loose images outside expected folders.
 */
function validateStructure(rootDir, tree) {
  const warnings = []
  if (!fs.existsSync(rootDir) || !tree) return warnings

  // Set of top-level keywords (e.g. Architecture, Art, Exhibitions)
  const rootKeywords = new Set(
    (tree.children || []).map(c => (c.keyword || c.title || '').toLowerCase())
  )

  // Set of all valid titles in studyTasksTree
  function getAllTreeTitles(node) {
    let titles = new Set()
    if (node.title) titles.add(node.title.toLowerCase())
    if (node.keyword) titles.add(node.keyword.toLowerCase())
    if (node.children) {
      for (const child of node.children) {
        const childTitles = getAllTreeTitles(child)
        for (const t of childTitles) titles.add(t)
      }
    }
    return titles
  }

  const allTreeTitles = getAllTreeTitles(tree)

  function checkDir(currentDir, relativePath = '') {
    if (!fs.existsSync(currentDir)) return

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    const pathParts = relativePath.split(path.sep).filter(Boolean)
    const depth = pathParts.length

    const subdirs = entries.filter(e => e.isDirectory())
    const imageFiles = entries.filter(e => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))

    // Depth 0: Root directory (SCAN_DIR)
    if (depth === 0) {
      for (const img of imageFiles) {
        warnings.push({
          type: 'LOOSE_IMAGE_AT_ROOT',
          path: path.join(currentDir, img.name),
          issue: `Image file "${img.name}" is placed directly in root archive directory, outside any Keyword folder (Architecture, Art, Exhibitions).`
        })
      }

      for (const dir of subdirs) {
        const folderLower = dir.name.toLowerCase()
        if (!rootKeywords.has(folderLower) && !allTreeTitles.has(folderLower)) {
          warnings.push({
            type: 'UNRECOGNIZED_KEYWORD_FOLDER',
            path: path.join(currentDir, dir.name),
            issue: `Folder "${dir.name}" in root directory does not match any expected Keyword (Architecture, Art, Exhibitions) in studyTasksTree.json.`
          })
        }
        checkDir(path.join(currentDir, dir.name), path.join(relativePath, dir.name))
      }
      return
    }

    // Depth 1: Top-level Keyword folder (e.g. Architecture)
    if (depth === 1) {
      for (const img of imageFiles) {
        warnings.push({
          type: 'LOOSE_IMAGE_AT_KEYWORD',
          path: path.join(currentDir, img.name),
          issue: `Image file "${img.name}" is placed directly inside top-level folder "${pathParts[0]}" instead of inside a category/subcategory folder.`
        })
      }

      for (const dir of subdirs) {
        const folderLower = dir.name.toLowerCase()
        if (!allTreeTitles.has(folderLower)) {
          warnings.push({
            type: 'UNRECOGNIZED_CATEGORY_FOLDER',
            path: path.join(currentDir, dir.name),
            issue: `Folder "${dir.name}" inside "${pathParts[0]}" does not match any category in studyTasksTree.json.`
          })
        }
        checkDir(path.join(currentDir, dir.name), path.join(relativePath, dir.name))
      }
      return
    }

    // Depth >= 2: Category / Subcategory folder
    const folderName = pathParts[depth - 1]
    const folderLower = folderName.toLowerCase()

    // Flag images placed directly in a folder alongside subfolders (outside subcategory folders)
    if (subdirs.length > 0 && imageFiles.length > 0) {
      for (const img of imageFiles) {
        warnings.push({
          type: 'IMAGE_OUTSIDE_SUBCATEGORY_FOLDER',
          path: path.join(currentDir, img.name),
          issue: `Image file "${img.name}" is placed at folder level "${folderName}" alongside subfolders, instead of inside a specific subcategory folder.`
        })
      }
    }

    for (const dir of subdirs) {
      const childLower = dir.name.toLowerCase()
      // Check if subfolder exists in studyTasksTree
      if (!allTreeTitles.has(childLower)) {
        // If parent folder is in tree, but this subfolder is not in tree:
        if (allTreeTitles.has(folderLower)) {
          warnings.push({
            type: 'UNRECOGNIZED_SUBFOLDER',
            path: path.join(currentDir, dir.name),
            issue: `Subfolder "${dir.name}" under "${folderName}" does not match any expected category/subcategory in studyTasksTree.json.`
          })
        }
      }
      checkDir(path.join(currentDir, dir.name), path.join(relativePath, dir.name))
    }
  }

  checkDir(rootDir, '')
  return warnings
}

function scanDirectory(dirPath, relativePath = '', globalPattern, globalPatternStr) {
  let results = []
  if (!fs.existsSync(dirPath)) return results

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const imageFiles = []
  let infoMetaData = null

  // Check for local info.json in current folder
  const infoPath = path.join(dirPath, 'info.json')
  if (fs.existsSync(infoPath)) {
    try {
      infoMetaData = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    } catch (e) {
      console.warn(`Warning: Could not parse ${infoPath}`)
    }
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name

    if (entry.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, relPath, globalPattern, globalPatternStr))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageFiles.push({ entry, fullPath, relPath })
      }
    }
  }

  if (imageFiles.length > 0) {
    const pathParts = relativePath.split(path.sep).filter(Boolean)
    const keyword = pathParts[0] || 'Architecture'
    
    let category = pathParts.length > 1 ? pathParts[pathParts.length - 2] : (pathParts[1] || 'General')
    let subcategory = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null

    if (pathParts.length === 2) {
      category = pathParts[1]
      subcategory = null
    }

    if (studyTasksTree) {
      if (category) {
        const matchedCat = findNodeTitleInTree(studyTasksTree, category.toLowerCase())
        if (matchedCat) category = matchedCat
      }
      if (subcategory) {
        const matchedSub = findNodeTitleInTree(studyTasksTree, subcategory.toLowerCase())
        if (matchedSub) subcategory = matchedSub
      }
    }

    const defaultAuthor = peopleList[0]?.id || 'p_001'
    const folderPattern = infoMetaData?.filePattern ? parsePattern(infoMetaData.filePattern) : globalPattern

    // Map of projectKey -> grouped project info & image list
    const projectGroups = new Map()

    imageFiles.forEach(({ entry, relPath }) => {
      const filename = entry.name
      const webUrl = `/archive-images/${relPath.replace(/\\/g, '/')}`
      
      let rawTitle = infoMetaData?.title
      let fileYear = infoMetaData?.year
      let authorId = infoMetaData?.authorId
      let categoryOverride = null
      let subcategoryOverride = null
      let extractedSheetId = null

      // Pattern extraction if folder/global pattern matches
      if (folderPattern) {
        const nameWithoutExt = path.parse(filename).name
        const match = nameWithoutExt.match(folderPattern)
        if (match && match.groups) {
          const g = match.groups
          if (g.title && !rawTitle) {
            rawTitle = g.title
          }
          if (g.year && !fileYear) {
            const parsedYear = parseInt(g.year, 10)
            if (!isNaN(parsedYear)) fileYear = parsedYear
          }
          if ((g.author || g.authorId) && !authorId) {
            authorId = findAuthorId(g.author || g.authorId, peopleList, defaultAuthor)
          }
          if (g.category) categoryOverride = g.category
          if (g.subcategory) subcategoryOverride = g.subcategory
          if (g.sheet || g.page || g.part || g.seq || g.index) {
            extractedSheetId = g.sheet || g.page || g.part || g.seq || g.index
          }
        }
      }

      // Extract base title and sheet number
      let title = ''
      let sheetId = extractedSheetId

      if (rawTitle) {
        const parsed = extractBaseTitleAndSheet(rawTitle)
        title = parsed.baseTitle
        if (!sheetId) sheetId = parsed.sheetId
      } else {
        const parsed = extractBaseTitleAndSheet(filename)
        title = parsed.baseTitle
        if (!sheetId) sheetId = parsed.sheetId
      }

      // Fallback for empty title or purely numeric title without metadata
      if (!title || /^\d+$/.test(title)) {
        const folderName = pathParts[pathParts.length - 1] || 'Drawing'
        title = cleanTitle(folderName)
      }

      if (!fileYear) {
        fileYear = extractYear(filename) || extractYear(relativePath) || 2020
      }
      const decade = Math.floor(fileYear / 10) * 10

      if (!authorId) {
        authorId = defaultAuthor
      }

      const finalCategory = categoryOverride || category
      const finalSubcategory = subcategoryOverride || subcategory

      // Key to group images belonging to the exact same project
      let projectKey
      if (infoMetaData?.singleProject) {
        projectKey = `folder_single_project_${relativePath}`
      } else {
        projectKey = `${authorId}::${fileYear}::${finalCategory}::${finalSubcategory || ''}::${title.toLowerCase()}`
      }

      if (!projectGroups.has(projectKey)) {
        projectGroups.set(projectKey, {
          title,
          description: infoMetaData?.description || `Archival item from RTU collection (${finalCategory}${finalSubcategory ? ' - ' + finalSubcategory : ''})`,
          authorId,
          year: fileYear,
          decade,
          studyTheme: finalCategory,
          keyword,
          category: finalCategory,
          subcategory: finalSubcategory,
          images: []
        })
      }

      projectGroups.get(projectKey).images.push({ webUrl, filename, sheetId })
    })

    // Convert grouped projects into final Project objects
    let groupIndex = 0
    for (const [, group] of projectGroups.entries()) {
      groupIndex++

      // Sort images naturally by sheetId or filename (1, 2, ..., 10)
      group.images.sort((a, b) => {
        if (a.sheetId && b.sheetId) {
          const numA = parseInt(a.sheetId, 10)
          const numB = parseInt(b.sheetId, 10)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.sheetId.localeCompare(b.sheetId, undefined, { numeric: true, sensitivity: 'base' })
        }
        return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
      })

      const imageUrls = group.images.map(img => img.webUrl)
      const titleSlug = group.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30)
      const folderIdPart = pathParts.join('_').replace(/[^a-zA-Z0-9]/g, '_')
      const projectId = `proj_local_${folderIdPart}_${titleSlug || groupIndex}_${groupIndex}`

      const projectObj = {
        id: projectId,
        type: 'project',
        title: group.title,
        description: group.description,
        authorId: group.authorId,
        year: group.year,
        decade: group.decade,
        images: imageUrls,
        studyTheme: group.studyTheme,
        keyword: group.keyword,
        category: group.category,
        subcategory: group.subcategory
      }

      results.push(projectObj)
    }
  }

  return results
}

function main() {
  const globalPatternStr = getPatternArg()
  const globalPattern = parsePattern(globalPatternStr)

  console.log(`Scanning local archive directory: ${SCAN_DIR}`)
  if (globalPatternStr) {
    console.log(`Applying filename pattern: "${globalPatternStr}"`)
  } else {
    console.log('No filename pattern set. Running default fallback scanning.')
  }

  if (!fs.existsSync(SCAN_DIR)) {
    console.error(`Error: Path "${SCAN_DIR}" does not exist on this machine.`)
    console.log(`Please make sure your drive/folder is connected or pass ARCHIVE_IMAGES_PATH="E:/your_path"`)
    process.exit(1)
  }

  // 1. Structure Check against studyTasksTree.json
  if (studyTasksTree) {
    const warnings = validateStructure(SCAN_DIR, studyTasksTree)
    console.log('\n======================================================================')
    console.log('             FOLDER STRUCTURE VALIDATION (studyTaskTree)')
    console.log('======================================================================')
    if (warnings.length === 0) {
      console.log('✓ Directory structure matches studyTasksTree.json perfectly!')
    } else {
      console.log(`\n[!] Found ${warnings.length} folder structure warning(s):\n`)
      warnings.forEach((w, i) => {
        console.log(`  ${i + 1}. [${w.type}]`)
        console.log(`     Path:  ${w.path}`)
        console.log(`     Issue: ${w.issue}\n`)
      })
    }
    console.log('======================================================================\n')
  }

  // 2. Scan projects
  const projects = scanDirectory(SCAN_DIR, '', globalPattern, globalPatternStr)
  const totalImages = projects.reduce((acc, p) => acc + (p.images ? p.images.length : 0), 0)

  console.log(`Found ${projects.length} project(s) containing ${totalImages} total image(s) in local archive.`)

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2), 'utf-8')
  console.log(`Successfully updated ${OUTPUT_FILE}`)
}

main()
