import { useEffect, useMemo } from 'react'
import previewDocument from '../assets/bang-cong-preview.html?raw'
import './AttendancePreview.css'

const extractTableMarkup = (documentHtml) => {
  const match = documentHtml.match(/<table>[\s\S]*?<\/table>/i)
  return match?.[0] || ''
}

function AttendancePreview() {
  const tableMarkup = useMemo(() => extractTableMarkup(previewDocument), [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Bảng công tháng 7/2026 — Preview'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <main className="attendance-preview-page">
      <div
        className="attendance-preview-sheet"
        aria-label="Bản xem trước bảng công tháng 7 năm 2026"
        dangerouslySetInnerHTML={{ __html: tableMarkup }}
      />
    </main>
  )
}

export default AttendancePreview
