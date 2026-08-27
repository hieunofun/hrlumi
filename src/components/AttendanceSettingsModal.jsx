import { useEffect, useState } from 'react'
import { fbGet, fbUpdate } from '../services/firebase'

function AttendanceSettingsModal({ isOpen, onClose }) {
  const [standardCheckIn, setStandardCheckIn] = useState('08:00')
  const [standardCheckOut, setStandardCheckOut] = useState('17:30')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError('')
    fbGet('hr/attendanceSettings/default').then(settings => {
      setStandardCheckIn(settings?.standardCheckIn || '08:00')
      setStandardCheckOut(settings?.standardCheckOut || '17:30')
    }).catch(requestError => setError(requestError.message)).finally(() => setLoading(false))
  }, [isOpen])

  const submit = async event => {
    event.preventDefault()
    if (standardCheckIn >= standardCheckOut) {
      setError('Giờ Check-out chuẩn phải sau giờ Check-in chuẩn.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await fbUpdate('hr/attendanceSettings/default', { standardCheckIn, standardCheckOut, timezone: 'Asia/Ho_Chi_Minh' })
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content attendance-settings" onClick={event => event.stopPropagation()}>
        <div className="modal-header"><h2>Cài đặt giờ chấm công</h2><button className="modal-close" onClick={onClose} type="button">&times;</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p style={{ marginBottom: 18, color: '#64748b' }}>Giờ chuẩn dùng để hệ thống tự tính số phút đi muộn và về sớm.</p>
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
            {loading ? <div style={{ padding: 24, textAlign: 'center' }}>Đang tải cài đặt...</div> : <div className="attendance-settings__grid">
              <div className="form-group"><label>Giờ Check-in chuẩn</label><input type="time" value={standardCheckIn} onChange={event => setStandardCheckIn(event.target.value)} required /></div>
              <div className="form-group"><label>Giờ Check-out chuẩn</label><input type="time" value={standardCheckOut} onChange={event => setStandardCheckOut(event.target.value)} required /></div>
            </div>}
          </div>
          <div className="attendance-settings__footer"><button className="btn" type="button" onClick={onClose}>Hủy</button><button className="btn btn-primary" type="submit" disabled={loading || saving}>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</button></div>
        </form>
      </div>
    </div>
  )
}

export default AttendanceSettingsModal
