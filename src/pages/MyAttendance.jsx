import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fbGetAttendanceByEmployee } from '../services/firebase'
import { buildAttendanceSummary } from '../utils/attendanceSummary'
import './MyAttendance.css'

const dateValue = log => String(log?.date || log?.timestamp || '').slice(0, 10)
const numberValue = value => Number.isFinite(Number(value)) ? Number(value) : 0
const timeValue = value => {
  if (!value) return '—'
  const match = String(value).match(/(\d{1,2}):(\d{2})/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value)
}

function MyAttendance() {
  const { user } = useAuth()
  const employeeId = String(user.id)
  const [logs, setLogs] = useState([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    fbGetAttendanceByEmployee(employeeId).then(data => {
      if (!active) return
      const nextLogs = data ? Object.entries(data).map(([id, value]) => ({ ...value, id })) : []
      setLogs(nextLogs)
      const latest = [...new Set(nextLogs.map(dateValue).map(value => value.slice(0, 7)))].filter(value => /^\d{4}-\d{2}$/.test(value)).sort().at(-1)
      if (latest) setMonth(latest)
    }).catch(requestError => {
      console.error('Không tải được Bảng công cá nhân:', requestError)
      if (active) setError('Không thể tải dữ liệu chấm công.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [employeeId])

  const months = useMemo(() => [...new Set(logs.map(dateValue).map(value => value.slice(0, 7)))].filter(value => /^\d{4}-\d{2}$/.test(value)).sort().reverse(), [logs])
  const monthLogs = useMemo(() => logs.filter(log => dateValue(log).startsWith(month)).sort((a, b) => dateValue(a).localeCompare(dateValue(b))), [logs, month])
  const summary = useMemo(() => buildAttendanceSummary({ attendanceLogs: logs, employees: [user], month }).find(row => String(row.employeeId) === employeeId), [employeeId, logs, month, user])

  return (
    <div className="my-attendance">
      <div className="page-header my-attendance__header">
        <div><h1 className="page-title"><i className="fas fa-calendar-check"></i>Bảng công</h1><p>Thông tin chấm công của {user.ho_va_ten || user.email}</p></div>
        <label><span>Tháng</span><select value={month} onChange={event => setMonth(event.target.value)}>{months.length === 0 && <option>{month}</option>}{months.map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      <section className="my-attendance__identity card">
        <div><span>Mã nhân viên</span><strong>{user.employeeId || '—'}</strong></div><div><span>Họ tên</span><strong>{user.ho_va_ten || '—'}</strong></div><div><span>Phòng ban</span><strong>{user.bo_phan || '—'}</strong></div><div><span>Chức vụ</span><strong>{user.vi_tri || '—'}</strong></div>
      </section>
      {loading ? <div className="card my-attendance__state">Đang tải dữ liệu...</div> : error ? <div className="card my-attendance__state is-error">{error}</div> : <>
        <section className="my-attendance__stats">
          <div className="card"><span>Ngày có dữ liệu</span><strong>{summary?.attendanceDays || 0}</strong></div><div className="card"><span>Tổng công</span><strong>{summary?.workdays || 0}</strong></div><div className="card"><span>Tổng giờ</span><strong>{summary?.totalHours || 0}</strong></div><div className="card"><span>Đi muộn</span><strong>{summary?.lateCount || 0} lần</strong><small>{summary?.lateMinutes || 0} phút</small></div><div className="card"><span>Về sớm</span><strong>{summary?.earlyCount || 0} lần</strong><small>{summary?.earlyMinutes || 0} phút</small></div><div className="card"><span>Quên chấm</span><strong>{summary?.missingPunchCount || 0}</strong></div>
        </section>
        <section className="card my-attendance__table-card"><h3>Chi tiết chấm công</h3><div className="my-attendance__table-wrap"><table><thead><tr><th>Ngày</th><th>Thứ</th><th>Vào</th><th>Ra</th><th>Công</th><th>Giờ</th><th>Vào trễ</th><th>Ra sớm</th><th>Ký hiệu</th></tr></thead><tbody>
          {monthLogs.length ? monthLogs.map(log => {
            const date = dateValue(log), hours = numberValue(log.tongGio ?? (numberValue(log.hours ?? log.soGio ?? log.gio) + numberValue(log.gioPlus)))
            return <tr key={log.id}><td>{date ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN') : '—'}</td><td>{log.dayOfWeek || log.thu || '—'}</td><td>{timeValue(log.checkIn || log.vao)}</td><td>{timeValue(log.checkOut || log.ra)}</td><td>{log.cong ?? '—'}</td><td>{hours || '—'}</td><td className={numberValue(log.lateMinutes ?? log.vaoTre) > 0 ? 'is-warning' : ''}>{numberValue(log.lateMinutes ?? log.vaoTre) || '—'}</td><td className={numberValue(log.earlyMinutes ?? log.raSom) > 0 ? 'is-warning' : ''}>{numberValue(log.earlyMinutes ?? log.raSom) || '—'}</td><td>{log.kyHieu || log.status || '—'}</td></tr>
          }) : <tr><td colSpan="9" className="my-attendance__empty">Không có dữ liệu trong tháng này.</td></tr>}
        </tbody></table></div></section>
      </>}
    </div>
  )
}

export default MyAttendance
