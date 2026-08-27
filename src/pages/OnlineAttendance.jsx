import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import './OnlineAttendance.css'

const getTime = value => {
  if (!value) return '—'
  const direct = String(value).match(/^(\d{1,2}):(\d{2})/)
  if (direct) return `${direct[1].padStart(2, '0')}:${direct[2]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
}

const displayDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value || '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function OnlineAttendance() {
  const { user } = useAuth()
  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadToday = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: requestError } = await supabase.rpc('get_online_attendance_today')
    if (requestError) setError(requestError.message)
    else setToday(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadToday() }, [loadToday])

  const record = today?.record || null
  const checkedIn = Boolean(record?.checkIn || record?.vao)
  const checkedOut = Boolean(record?.checkOut || record?.ra)
  const lateMinutes = Math.max(0, Number(record?.lateMinutes ?? record?.vaoTre ?? 0) || 0)
  const earlyMinutes = Math.max(0, Number(record?.earlyMinutes ?? record?.raSom ?? 0) || 0)
  const standardRange = `${today?.standardCheckIn || '08:00'} - ${today?.standardCheckOut || '17:30'}`

  const submit = async action => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    setNotice('')
    const functionName = action === 'in' ? 'employee_online_check_in' : 'employee_online_check_out'
    const { data, error: requestError } = await supabase.rpc(functionName)
    if (requestError) {
      setError(requestError.message)
      await loadToday()
    } else {
      setToday(current => ({
        ...current,
        ...data,
        standardCheckIn: data.standardCheckIn || current?.standardCheckIn,
        standardCheckOut: data.standardCheckOut || current?.standardCheckOut
      }))
      setNotice(action === 'in' ? 'Check-in thành công.' : 'Check-out thành công.')
    }
    setSubmitting(false)
  }

  return (
    <div className="online-attendance">
      <div className="page-header online-attendance__header">
        <div><h1>Chấm công online</h1><p>{user.ho_va_ten || user.email} · {displayDate(today?.date)}</p></div>
        <Link className="btn online-attendance__view-link" to="/bang-cong">Xem bảng công</Link>
      </div>

      {loading ? <div className="online-attendance__state">Đang lấy trạng thái hôm nay...</div> : (
        <section className="online-attendance__sheet">
          <div className="online-attendance__workday">
            <div><span>Ngày làm việc</span><strong>{displayDate(today?.date)}</strong></div>
            <div><span>Ca làm việc</span><strong>{standardRange}</strong></div>
          </div>

          {error && <div className="online-attendance__message is-error">{error}</div>}
          {notice && <div className="online-attendance__message is-success">{notice}</div>}

          <div className="online-attendance__punches">
            <div className="online-attendance__punch">
              <span>Check-in</span>
              <strong>{checkedIn ? getTime(record?.vao || record?.checkIn) : 'Chưa chấm công'}</strong>
              <small>{checkedIn ? (lateMinutes > 0 ? `Muộn ${lateMinutes} phút` : 'Đúng giờ') : '—'}</small>
            </div>
            <div className="online-attendance__punch">
              <span>Check-out</span>
              <strong>{checkedOut ? getTime(record?.ra || record?.checkOut) : 'Chưa check-out'}</strong>
              <small>{checkedOut ? (earlyMinutes > 0 ? `Về sớm ${earlyMinutes} phút` : 'Đúng giờ') : '—'}</small>
            </div>
          </div>

          <div className="online-attendance__footer">
            <div className="online-attendance__actions">
              {!checkedIn && <button className="online-attendance__action" type="button" disabled={submitting} onClick={() => submit('in')}>{submitting ? 'Đang ghi nhận...' : 'Check-in'}</button>}
              {checkedIn && !checkedOut && <button className="online-attendance__action" type="button" disabled={submitting} onClick={() => submit('out')}>{submitting ? 'Đang ghi nhận...' : 'Check-out'}</button>}
              {checkedOut && <div className="online-attendance__done"><span>✓</span> Đã hoàn thành chấm công hôm nay</div>}
            </div>
            <small>Thời gian được ghi nhận theo giờ máy chủ Việt Nam.</small>
          </div>
        </section>
      )}
    </div>
  )
}

export default OnlineAttendance
