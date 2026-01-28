import { useState } from 'react'
import { Clipboard, Check, Share2, Clock, Eye } from 'lucide-react'
import './App.css'

function App() {
  const [content, setContent] = useState('')
  const [ttl, setTtl] = useState<number | undefined>(undefined)
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ id: string, url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          ttl_seconds: ttl,
          max_views: maxViews,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to create paste')
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="container">
      <h1>Pastebin-Lite</h1>

      <div className="card">
        <label>Share your thoughts...</label>
        <textarea
          placeholder="Paste your text here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="controls">
          <div className="input-group">
            <label><Clock size={16} /> TTL (Seconds)</label>
            <input
              type="number"
              placeholder="Infinity"
              value={ttl || ''}
              onChange={(e) => setTtl(e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="input-group">
            <label><Eye size={16} /> Max Views</label>
            <input
              type="number"
              placeholder="Unlimited"
              value={maxViews || ''}
              onChange={(e) => setMaxViews(e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Secret Paste'}
        </button>

        {result && (
          <div className="result">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Share2 size={20} color="#22c55e" /> Paste Created Successfully!
            </div>
            <div className="url-box">
              <div className="url">{result.url}</div>
              <button className="copy-btn" onClick={copyToClipboard} style={{ margin: 0, width: 'auto' }}>
                {copied ? <Check size={20} color="#22c55e" /> : <Clipboard size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
        Encrypted at rest • Self-destructing • Open Source
      </p>
    </div>
  )
}

export default App
