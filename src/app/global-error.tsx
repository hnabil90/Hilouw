'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="fr"><body style={{ margin: 0, background: '#FAF7F2', color: '#292521', fontFamily: 'system-ui, sans-serif' }}>
    <main style={{ maxWidth: 700, margin: '12vh auto', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: '2.5rem', color: '#3D261C' }}>Un petit contretemps.</h1>
      <p>Le site est momentanément indisponible. Réessayez dans quelques instants.</p>
      <button onClick={reset} style={{ marginTop: 24, padding: '1rem 1.5rem', background: '#3D261C', color: '#FAF7F2', border: 0, cursor: 'pointer', fontSize: '1rem' }}>Réessayer</button>
    </main></body></html>
}
