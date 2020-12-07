import { removeFromLast } from './utils.mjs'
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

export function findRouteByPath(path, routes) {
  for (const route of routes) {
    if (route.path && removeFromLast(route.path, '.') === path) {
      return route
    }
    const childPath = route.routes && findRouteByPath(path, route.routes)
    if (childPath) return childPath
  }
}

export function getPaths(nextRoutes, carry = [{ params: { slug: [] } }]) {
  nextRoutes.forEach(({ path, routes }) => {
    if (path) {
      carry.push(removeFromLast(path, '.'))
    } else if (routes) {
      getPaths(routes, carry)
    }
  })

  return carry
}
