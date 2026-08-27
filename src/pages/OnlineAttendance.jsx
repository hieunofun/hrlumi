import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const standardRange = useMemo(() => `${today?.standardCheckIn || '08:00'} – ${today?.standardCheckOut || '17:30'}`, [today])

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
        <div><h1 className="page-title"><i className="fas fa-mobile-screen-button"></i>Chấm công online</h1><p>Xin chào {user.ho_va_ten || user.email}</p></div>
        <Link className="btn" to="/bang-cong"><i className="fas fa-calendar-check"></i>Bảng công</Link>
      </div>

      {loading ? <section className="card online-attendance__state">Đang lấy trạng thái hôm nay...</section> : (
        <section className="card online-attendance__card">
          <div className="online-attendance__date"><span>Hôm nay</span><strong>{displayDate(today?.date)}</strong></div>
          <div className="online-attendance__standard"><span>Giờ làm chuẩn</span><strong>{standardRange}</strong><small>Giờ Việt Nam · thời gian ghi nhận từ máy chủ</small></div>

          {error && <div className="online-attendance__message is-error">{error}</div>}
          {notice && <div className="online-attendance__message is-success">{notice}</div>}

          <div className="online-attendance__times">
            <article className={checkedIn ? 'is-complete' : ''}><i className="fas fa-right-to-bracket"></i><span>Check-in</span><strong>{getTime(record?.vao || record?.checkIn)}</strong><small>Đi muộn: {lateMinutes} phút</small></article>
            <article className={checkedOut ? 'is-complete' : ''}><i className="fas fa-right-from-bracket"></i><span>Check-out</span><strong>{getTime(record?.ra || record?.checkOut)}</strong><small>Về sớm: {earlyMinutes} phút</small></article>
          </div>

          {!checkedIn && <button className="online-attendance__action is-checkin" type="button" disabled={submitting} onClick={() => submit('in')}><i className="fas fa-fingerprint"></i>{submitting ? 'Đang ghi nhận...' : 'Check-in'}</button>}
          {checkedIn && !checkedOut && <button className="online-attendance__action is-checkout" type="button" disabled={submitting} onClick={() => submit('out')}><i className="fas fa-fingerprint"></i>{submitting ? 'Đang ghi nhận...' : 'Check-out'}</button>}
          {checkedOut && <div className="online-attendance__done"><i className="fas fa-circle-check"></i>Bạn đã hoàn tất chấm công hôm nay.</div>}
        </section>
      )}
    </div>
  )
}

export default OnlineAttendance
