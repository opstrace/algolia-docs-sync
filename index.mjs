import core from '@actions/core'
import algoliasearch from 'algoliasearch'
import unified from 'unified'
import markdown from 'remark-parse'
import remarkToRehype from 'remark-rehype'
import raw from 'rehype-raw'
import toString from 'mdast-util-to-string'
import GithubSlugger from 'github-slugger'
import md5 from 'md5'
import { removeFromLast } from './lib/docs/utils.mjs'
import { getFile, fetchDocsManifest } from './lib/docs/page.mjs'

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
const CONTAINERS = ['ul', 'ol', 'details']
const CONTENT = ['p', 'blockquote', 'li']

const processor = unified()
  .use(markdown)
  .use(remarkToRehype, { allowDangerousHtml: true })
  .use(raw)
  .use(toTree)

function toTree() {
  // A compiler is required, and we only need the AST
  this.Compiler = (tree) => tree
}

function flattenRoutes(carry, { path, routes }) {
  if (path) {
    carry.push(path)
  } else if (routes) {
    routes.forEach((route) => {
      flattenRoutes(carry, route)
    })
  }
  return carry
}

function getText(node) {
  return toString(node).replace(/\xA0/g, ' ')
}

async function addRecords(filePath) {
  const md = await getFile(filePath)
  const tree = await processor.process(md)

  const { result } = tree
  const slugger = new GithubSlugger()
  const records = []

  let record = {
    content: '',
    sections: []
  }

  const addSection = (node) => {
    const text = getText(node)

    record.sections.push({
      name: text,
      anchor: slugger.slug(text),
      subsections: [],
      content: ''
    })
  }
  const addSubSection = (name) => {
    if (record.sections.length !== 0) {
      record.sections[record.sections.length - 1].subsections.push(name)
    }
  }
  const addContent = (text) => {
    if (record.sections.length === 0) {
      record.content += text
    } else {
      record.sections[record.sections.length - 1].content += text
    }
  }
  const handleHeading = (node) => {
    const value = getText(node)

    switch (node.tagName) {
      case 'h1':
        record.title = value
        record.anchor = slugger.slug(value)
        break
      case 'h2':
        addSection(node)
        break
      case 'h3':
        addSubSection(value)
        break
      case 'h4':
      case 'h5':
      case 'h6':
        addSubSection(value)
        break
      default:
        throw new Error(`Unhandled node: ${node.tagName}`)
    }
  }
  const addRecord = () => {
    const path = removeFromLast(filePath, '.')
    const objectID = `${path}-${md5(record.anchor)}`
    records.push({ ...record, path, objectID })
  }
  const handleNode = (node, parent) => {
    if (node.type === 'element') {
      if (node.tagName === 'summary' && parent.tagName === 'details') {
        record.summary = getText(node)
        return
      }

      if (CONTENT.includes(node.tagName)) {
        let text = getText(node)
        addContent(text)
        return
      }

      if (HEADINGS.includes(node.tagName)) {
        handleHeading(node)
        return
      }

      if (CONTAINERS.includes(node.tagName)) {
        if (node.children) {
          node.children.forEach((n) => handleNode(n, node))

          if (node.tagName === 'details') {
            delete record.summary
          }
        }
      }
    }
  }

  result.children.forEach(handleNode)
  addRecord()

  return records
}

async function indexDocs() {
  const client = algoliasearch(
    core.getInput('algoliaId'),
    core.getInput('algoliaKey')
  )
  // Init the docs index, this will throw if the index doesn't exist
  const index = await client.initIndex(core.getInput('algoliaIndex'))
  const manifest = fetchDocsManifest()
  const files = manifest.routes.reduce(flattenRoutes, [])
  const recordsByFile = await Promise.all(
    files.map((filePath) => addRecords(filePath))
  )
  // Group all records into a single array
  const objects = recordsByFile.reduce((records, record) => {
    records.push(...record)
    return records
  }, [])

  // Init a temporal index which will receive the objects
  const tmpIndex = await client.initIndex('docs_tmp')

  // Copy the settings from the main index to the temporal index
  await client.copySettings(index.indexName, tmpIndex.indexName)

  while (objects.length) {
    const { taskIDs } = await tmpIndex.saveObjects(objects.splice(0, 1000))

    while (taskIDs.length) {
      await tmpIndex.waitTask(taskIDs.shift())
    }
  }

  // Move the temporal index to the docs index, this will rename the temporal index
  // so we don't have to remove it
  await client.moveIndex(tmpIndex.indexName, index.indexName)
}

indexDocs()
