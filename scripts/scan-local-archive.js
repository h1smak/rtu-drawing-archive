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

  // Convert template tokens like {year}, {author}, {title}, {category}, {subcategory}
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
    const folderPatternStr = infoMetaData?.filePattern || globalPatternStr
    const folderPattern = infoMetaData?.filePattern ? parsePattern(infoMetaData.filePattern) : globalPattern

    imageFiles.forEach(({ entry, relPath }, index) => {
      const filename = entry.name
      const nameWithoutExt = path.parse(filename).name
      const webUrl = `/archive-images/${relPath.replace(/\\/g, '/')}`
      
      let title = infoMetaData?.title
      let fileYear = infoMetaData?.year
      let authorId = infoMetaData?.authorId
      let categoryOverride = null
      let subcategoryOverride = null

      // If pattern is provided, attempt pattern extraction
      if (folderPattern) {
        const match = nameWithoutExt.match(folderPattern)
        if (match && match.groups) {
          const g = match.groups
          if (g.title && !title) {
            title = cleanTitle(g.title)
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
        }
      }

      // Fallback flow if metadata fields were not set by pattern
      if (!fileYear) {
        fileYear = extractYear(filename) || extractYear(relativePath) || 2020
      }
      const decade = Math.floor(fileYear / 10) * 10

      if (!title) {
        title = cleanTitle(filename)
      }

      if (!authorId) {
        authorId = defaultAuthor
      }

      const finalCategory = categoryOverride || category
      const finalSubcategory = subcategoryOverride || subcategory

      const projectObj = {
        id: `proj_local_${pathParts.join('_').replace(/[^a-zA-Z0-9]/g, '_')}_${index + 1}`,
        type: 'project',
        title: title,
        description: infoMetaData?.description || `Archival item from RTU collection (${finalCategory}${finalSubcategory ? ' - ' + finalSubcategory : ''})`,
        authorId: authorId,
        year: fileYear,
        decade: decade,
        images: [webUrl],
        studyTheme: finalCategory,
        keyword: keyword,
        category: finalCategory,
        subcategory: finalSubcategory
      }

      results.push(projectObj)
    })
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

  const projects = scanDirectory(SCAN_DIR, '', globalPattern, globalPatternStr)
  console.log(`Found ${projects.length} project image(s) in local archive.`)

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2), 'utf-8')
  console.log(`Successfully updated ${OUTPUT_FILE}`)
}

main()
