/* Компиляция рукописи в настоящий EPUB 3 (JSZip) + SHA-256 подпись авторства */

import JSZip from 'jszip'
import type { Project } from '../types'
import { renderCoverBlob } from './coverRender'
import { mdToHtml } from './markdown'
import { slugify } from './utils'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Текст главы (Markdown) → валидный XHTML. Спойлеры остаются обычным текстом. */
function chapterBody(text: string): string {
  const html = mdToHtml(text, { spoilers: 'plain' })
  return html || '    <p></p>'
}

export async function computeTextHash(project: Project): Promise<string> {
  const full = project.chapters
    .map((c) => `${c.title}\n${c.content}`)
    .join('\n\n')
  const data = new TextEncoder().encode(`${project.title}::${project.author}::${full}`)
  if (crypto?.subtle) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', data)
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      /* fallback ниже */
    }
  }
  /* простой детерминированный фолбэк */
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < data.length; i++) {
    h1 = Math.imul(h1 ^ data[i], 2654435761)
    h2 = Math.imul(h2 ^ data[i], 1597334677)
  }
  return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padEnd(64, '0')
}

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`

const STYLE = `body{margin:0;font-family:"Georgia",serif;line-height:1.7;color:#222}
h2{font-size:1.5em;margin:2em 0 1em;text-align:center}
h3{font-size:1.25em;margin:1.6em 0 .7em}
h4{font-size:1.08em;margin:1.4em 0 .5em;letter-spacing:.05em;text-transform:uppercase}
p{text-indent:1.4em;margin:0 0 .4em;text-align:justify}
p.first{text-indent:0}
blockquote{margin:1.3em 0;padding:.2em 0 .2em 1.2em;border-left:3px solid #b98a72;color:#555;font-style:italic}
ul,ol{margin:1em 0;padding-left:1.7em}
li{margin:.35em 0}
hr{border:0;border-top:1px solid #ccc;width:40%;margin:2.2em auto}
code{font-family:"Menlo","Consolas",monospace;font-size:.9em;background:#f0ece2;padding:.1em .35em;border-radius:4px}
a{color:#a5502f}
.cover{margin:0;padding:0;text-align:center}
.cover img{max-width:100%;height:auto}`

function chapterXhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="../style.css"/></head>
<body>
  <h2>${esc(title)}</h2>
${body}
</body>
</html>`
}

/**
 * Собрать EPUB 3 из проекта.
 * Возвращает Blob и короткий хэш подписи для UI.
 */
export async function buildEpub(project: Project): Promise<{ blob: Blob; hash: string }> {
  const zip = new JSZip()

  /* mimetype первым и без сжатия — требование стандарта */
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', CONTAINER)

  const oebps = zip.folder('OEBPS')!
  oebps.file('style.css', STYLE)

  /* обложка */
  const coverBlob = await renderCoverBlob({
    preset: project.cover.preset,
    photo: project.cover.photo,
    title: project.title,
    author: project.author,
  })
  if (coverBlob) oebps.folder('images')!.file('cover.png', coverBlob)

  const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Cover</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><div class="cover"><img src="images/cover.png" alt="${esc(project.title)}"/></div></body>
</html>`
  oebps.file('cover.xhtml', coverXhtml)

  /* главы */
  const chapterFiles = project.chapters.map((ch, i) => {
    const n = i + 1
    const title = ch.title.trim() || `Chapter ${n}`
    return { id: `ch${n}`, href: `text/ch${n}.xhtml`, title }
  })

  chapterFiles.forEach((cf, i) => {
    const ch = project.chapters[i]
    const body = chapterBody(ch.content)
    oebps.folder('text')!.file(`ch${i + 1}.xhtml`, chapterXhtml(cf.title, body))
  })

  const hash = await computeTextHash(project)

  /* навигация */
  const navItems = chapterFiles
    .map((cf) => `      <li><a href="${cf.href}">${esc(cf.title)}</a></li>`)
    .join('\n')
  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`
  oebps.file('nav.xhtml', nav)

  /* OPF */
  const manifestItems = [
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="css" href="style.css" media-type="text/css"/>`,
    coverBlob ? `    <item id="cover-image" href="images/cover.png" media-type="image/png" properties="cover-image"/>` : '',
    coverBlob ? `    <item id="coverpage" href="cover.xhtml" media-type="application/xhtml+xml"/>` : '',
    ...chapterFiles.map((cf) => `    <item id="${cf.id}" href="${cf.href}" media-type="application/xhtml+xml"/>`),
  ]
    .filter(Boolean)
    .join('\n')

  const spineRefs = [
    coverBlob ? `    <itemref idref="coverpage"/>` : '',
    ...chapterFiles.map((cf) => `    <itemref idref="${cf.id}"/>`),
  ]
    .filter(Boolean)
    .join('\n')

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${project.id}</dc:identifier>
    <dc:title>${esc(project.title)}</dc:title>
    <dc:creator>${esc(project.author || 'Unknown')}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta>
    <meta name="signature" content="sha256:${hash.slice(0, 32)}"/>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine>
${spineRefs}
  </spine>
</package>`
  oebps.file('content.opf', opf)

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
  return { blob, hash }
}

/** Скачивание EPUB как файл. */
export async function downloadEpub(project: Project): Promise<string> {
  const { blob, hash } = await buildEpub(project)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(project.title)}.epub`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return hash
}
