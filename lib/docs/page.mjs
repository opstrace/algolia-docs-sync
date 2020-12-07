import fs from 'fs'
import path from 'path'

export function fetchDocsManifest() {
  const filePath = path.join(process.cwd(), 'docs')
  const contents = fs.readFileSync(`${filePath}/manifest.json`, 'utf8')
  const jp = JSON.parse(contents)
  return jp
}

export function getFile(file) {
  const filePath = path.join(process.cwd(), file)
  return fs.readFileSync(`${filePath}`, 'utf8')
}
