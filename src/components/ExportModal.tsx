import { useEffect, useState } from 'react'
import { Check, Download, Send, ShieldCheck } from 'lucide-react'
import { useStudio, projectWords } from '../lib/studioContext'
import { downloadEpub, computeTextHash } from '../lib/epub'
import { sendToReader } from '../lib/readerBridge'
import { mdToHtml } from '../lib/markdown'
import { toast } from '../lib/toastBus'
import { useI18n } from '../lib/i18n'

type Props = {
  projectId: string
  onClose: () => void
}

type Phase = 'idle' | 'working' | 'epubDone' | 'readerSent' | 'fallback'

/** Export the manuscript: a real EPUB 3 + direct hand-off to MKitap Reader. */
export function ExportModal({ projectId, onClose }: Props) {
  const { projects } = useStudio()
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('idle')
  const [hash, setHash] = useState<string>('')

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    let alive = true
    if (project) {
      void computeTextHash(project).then((h) => {
        if (alive) setHash(h)
      })
    }
    return () => {
      alive = false
    }
  }, [project])

  if (!project) return null

  const words = projectWords(project)
  const busy = phase === 'working'

  const handleEpub = async () => {
    setPhase('working')
    try {
      await downloadEpub(project)
      setPhase('epubDone')
      toast(t('epubReady'), { sparkle: true })
    } catch {
      setPhase('idle')
    }
  }

  const handleReader = async () => {
    setPhase('working')
    /* чистый HTML из Markdown — ридер получает уже готовую вёрстку */
    const html =
      project.chapters
        .map((ch) => `<h2>${escapeHtml(ch.title.trim() || 'Chapter')}</h2>${mdToHtml(ch.content, { spoilers: 'plain' })}`)
        .join('\n') || '<p></p>'
    const result = await sendToReader({
      title: project.title,
      author: project.author,
      contentHtml: html,
    })
    if (result === 'sent') {
      setPhase('readerSent')
      toast(t('sentToReader'), { sparkle: true })
    } else {
      setPhase('fallback')
      await downloadEpub(project)
      toast(t('readerNotFound'))
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          вњ•
        </button>

        <p className="eyebrow">{t('exKicker')}</p>
        <h2>{t('exTitle')}</h2>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '-14px 0 20px' }}>
          {project.title} · {words.toLocaleString()} {t('wordsShort')}
        </p>

        <div className="ex-grid">
          <div className="ex-card featured">
            <span className="ex-icon">
              <Send size={19} />
            </span>
            <div>
              <h3>MKitap Reader</h3>
              <span className="ex-sub">local · instant</span>
            </div>
            <p>{t('readerS')}</p>
            <button className="btn-primary" onClick={() => void handleReader()} disabled={busy}>
              {phase === 'readerSent' ? <Check size={15} /> : <Send size={14} />}
              <span>
                {busy ? t('sending') : phase === 'readerSent' ? t('sentToReader') : t('sendToReader')}
              </span>
            </button>
          </div>

          <div className="ex-card">
            <span className="ex-icon alt">
              <Download size={19} />
            </span>
            <div>
              <h3>.EPUB</h3>
              <span className="ex-sub">EPUB 3 · cover · TOC</span>
            </div>
            <p>{t('epubS')}</p>
            <button className="btn-secondary" onClick={() => void handleEpub()} disabled={busy}>
              {phase === 'epubDone' ? <Check size={15} /> : <Download size={14} />}
              <span>{busy ? t('compilingEpub') : t('downloadEpub')}</span>
            </button>
          </div>
        </div>

        <div className="signature-block">
          <ShieldCheck size={30} />
          <div>
            <h4>{t('signatureT')}</h4>
            <p>{t('signatureS')}</p>
            {hash && <div className="signature-hash">{t('signatureHash')}: sha256:{hash.slice(0, 32)}…</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
