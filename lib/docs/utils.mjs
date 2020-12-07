/**
 * Copyright © 2020 Vercel Inc. All rights reserved.
 * Forked from: vercel/nextjs-website
 */

// Handle optional catch all route for `/docs`
function getDocsSlug(slug) {
  if (slug && slug.length) {
    return slug
  } else {
    return 'quickstart'
  }
}

export function getSlug(params) {
  // Handle optional catch all route for `/docs`
  const slug = getDocsSlug(params.slug)
  if (slug[0] === 'tag') {
    return {
      tag: slug[1],
      slug: `/docs/${getDocsSlug(slug.slice(2)).join('/')}`
    }
  }

  return { slug: `/docs/${slug.join('/')}` }
}

export function removeFromLast(path, key) {
  const i = path.lastIndexOf(key)
  return i === -1 ? path : path.substring(0, i)
}

export function addTagToSlug(slug, tag) {
  return tag ? slug.replace('/docs', `/docs/tag/${tag}`) : slug
}
