"use client"
import Image from "@/lib/compat/Image"
import { useState } from "react"

export default function PneumoniaUploader() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      setResult({ error: 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={loading}>Predict</button>
      </form>

      {loading && <p>Loading...</p>}

      {result && result.error && <p style={{ color: 'red' }}>{result.error}</p>}

      {result && !result.error && (
        <div>
          <p><strong>Label:</strong> {result.label}</p>
          <p><strong>Confidence:</strong> {(result.confidence || 0).toFixed(4)}</p>
          {result.heatmap && (
            <Image
              src={`data:image/png;base64,${result.heatmap}`}
              alt="grad-cam"
              width={400}
              height={300}
              unoptimized
              style={{ objectFit: 'contain', maxWidth: '100%' }}
            />
          )}
        </div>
      )}
    </div>
  )
}