import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

window.onerror = function (msg, url, line, col, err) {
  document.body.innerHTML = `
    <div style="padding:20px;font-family:sans-serif;background:#fef2f2;border:2px solid #ef4444;margin:20px;border-radius:12px">
      <h2 style="color:#dc2626;margin:0 0 8px">❌ JavaScript Hatası</h2>
      <p style="color:#991b1b;font-size:14px;margin:0 0 4px"><strong>Mesaj:</strong> ${msg}</p>
      <p style="color:#991b1b;font-size:14px;margin:0">Dosya: ${url}:${line}:${col}</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer">Sayfayı Yenile</button>
    </div>
  `
  return true
}

window.addEventListener('unhandledrejection', function (e) {
  document.body.innerHTML = `
    <div style="padding:20px;font-family:sans-serif;background:#fef2f2;border:2px solid #ef4444;margin:20px;border-radius:12px">
      <h2 style="color:#dc2626;margin:0 0 8px">❌ Promise Hatası</h2>
      <p style="color:#991b1b;font-size:14px;margin:0">${e.reason?.message || e.reason || 'Bilinmeyen hata'}</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer">Sayfayı Yenile</button>
    </div>
  `
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
