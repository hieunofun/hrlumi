import { useEffect, useMemo, useState } from 'react'
import { fbGet } from '../services/firebase'
import { buildAttendanceSummary } from '../utils/attendanceSummary'
import './AttendancePreview.css'

const money = value => Number(value || 0).toLocaleString('vi-VN')
const dateText = value => {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value || ''
}
const contractType = row => row.contractType || (String(row.employmentStatus).toLowerCase().includes('chính thức') ? 'Chính Thức' : 'Thử việc')
const dayCode = day => {
  if (!day) return ''
  const statuses = day.logs.map(log => String(log.kyHieuPlus || log.kyHieu || log.status || '').trim().toUpperCase()).filter(Boolean)
  const code = statuses.find(value => ['X', 'X1', 'X2', 'X3', 'P1'].includes(value))
  if (code) return code
  if (day.paidLeaveWorkdays > 0 || statuses.includes('V')) return 'P1'
  if (day.unapprovedAbsence) return 'X'
  return Number(day.workdays) || ''
}
const penalties = row => {
  const under30 = Number(row.lateUnder30Count || 0) + Number(row.earlyUnder30Count || 0)
  const over30 = Number(row.lateOver30Count || 0) + Number(row.earlyOver30Count || 0)
  const missing = Number(row.missingPunchCount || 0)
  const absence = Number(row.unapprovedAbsenceCount || 0)
  const lateFine = under30 * 50000
  const overFine = over30 * 100000
  const missingFine = missing * 50000
  const absenceFine = absence * 200000
  return { under30, over30, missing, absence, lateFine, overFine, missingFine, absenceFine, total: lateFine + overFine + missingFine + absenceFine }
}
const TEAM_DEPARTMENTS = new Map([
  ['tuấn', 'MKT'],
  ['toàn', 'Kế toán'],
  ['trang', 'Sale'],
  ['quốc anh', 'Vận hành'],
  ['hưng', 'Vận hành']
])
const inferDepartmentFromPosition = position => {
  const value = String(position || '').trim().toLocaleLowerCase('vi')
  if (!value) return ''
  if (/nhân sự|\bhr\b|admin/.test(value)) return 'Nhân sự'
  if (/kế toán|account/.test(value)) return 'Kế toán'
  if (/social media|marketing|\bmkt\b|seo|content|designer|media/.test(value)) return 'MKT'
  if (/sale|kinh doanh/.test(value)) return 'Sale'
  if (/vận hành|kho|thu mua|xuất nhập khẩu|logistics/.test(value)) return 'Vận hành'
  return ''
}
const resolveDepartment = row => {
  const storedDepartment = String(row.department || '').trim()
  const teamDepartment = TEAM_DEPARTMENTS.get(storedDepartment.toLocaleLowerCase('vi'))
  return teamDepartment || inferDepartmentFromPosition(row.position) || storedDepartment || 'Chưa phân bộ phận'
}
const getConsecutiveDepartmentRowSpans = rows => rows.map((row, index) => {
  const department = row.displayDepartment
  if (!department) return 1
  const previousDepartment = rows[index - 1]?.displayDepartment
  if (department === previousDepartment) return 0
  let rowSpan = 1
  while (rows[index + rowSpan]?.displayDepartment === department) rowSpan += 1
  return rowSpan
})
const groupRowsByDepartment = rows => {
  const groups = new Map()
  rows.forEach(row => {
    const department = resolveDepartment(row)
    const key = department.toLocaleLowerCase('vi')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ ...row, displayDepartment: department })
  })
  return Array.from(groups.values()).flat()
}

function AttendancePreview() {
  const [employees, setEmployees] = useState([])
  const [logs, setLogs] = useState([])
  const [month, setMonth] = useState('')
  const [adjustments, setAdjustments] = useState({})
  const [manuals, setManuals] = useState({})
  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fbGet('employees'), fbGet('hr/attendanceLogs')]).then(([employeeData, logData]) => {
      const employeeList = employeeData ? Object.entries(employeeData).map(([id, value]) => ({ ...value, id })) : []
      const logList = logData ? Object.entries(logData).map(([id, value]) => ({ ...value, id })) : []
      setEmployees(employeeList)
      setLogs(logList)
      const latest = [...new Set(logList.map(log => String(log.date || log.timestamp || '').slice(0, 7)))].filter(value => /^\d{4}-\d{2}$/.test(value)).sort().at(-1)
      setMonth(latest || new Date().toISOString().slice(0, 7))
    }).catch(requestError => {
      console.error('Không tải được preview bảng công:', requestError)
      setError('Không thể tải dữ liệu bảng công.')
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!month) return
    setMonthLoading(true)
    setAdjustments({})
    setManuals({})
    Promise.all([fbGet(`hr/attendanceAdjustments/${month}`), fbGet(`hr/manualWorkdays/${month}`)])
      .then(([nextAdjustments, nextManuals]) => {
        setAdjustments(nextAdjustments || {})
        setManuals(nextManuals || {})
      })
      .catch(requestError => console.error('Không tải được dữ liệu điều chỉnh:', requestError))
      .finally(() => setMonthLoading(false))
  }, [month])

  const months = useMemo(() => [...new Set(logs.map(log => String(log.date || log.timestamp || '').slice(0, 7)))].filter(value => /^\d{4}-\d{2}$/.test(value)).sort().reverse(), [logs])
  const rows = useMemo(() => groupRowsByDepartment(buildAttendanceSummary({ attendanceLogs: logs, employees, month, attendanceAdjustments: adjustments, manualWorkdays: manuals })), [adjustments, employees, logs, manuals, month])
  const departmentRowSpans = useMemo(() => getConsecutiveDepartmentRowSpans(rows), [rows])
  const calendar = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const daysInMonth = year && monthNumber ? new Date(year, monthNumber, 0).getDate() : 31
    return Array.from({ length: 31 }, (_, index) => {
      const day = index + 1
      const weekday = day <= daysInMonth ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(year, monthNumber - 1, day).getDay()] : ''
      return { day, weekday }
    })
  }, [month])
  const totals = useMemo(() => rows.reduce((result, row) => {
    const fine = penalties(row)
    Object.keys(fine).forEach(key => { result[key] = (result[key] || 0) + fine[key] })
    result.overtime = (result.overtime || 0) + Number(row.overtimeHours || 0)
    result.leave = (result.leave || 0) + Number(row.paidLeaveWorkdays || 0)
    result.probation = (result.probation || 0) + Number(row.probationWorkdays || 0)
    result.official = (result.official || 0) + Number(row.officialWorkdays || 0)
    result.workdays = (result.workdays || 0) + Number(row.workdays || 0)
    return result
  }, {}), [rows])
  const weekly = useMemo(() => [1, 8, 15, 22, 29].map((start, index) => {
    const end = Math.min(start + 6, calendar.length)
    const events = [
      ['Đi muộn', day => day?.late], ['Không chấm công', day => day?.missingPunch], ['Nghỉ không phép', day => day?.unapprovedAbsence]
    ].map(([label, predicate]) => {
      const people = rows.filter(row => Array.from({ length: Math.max(0, end - start + 1) }, (_, offset) => row.days.get(`${month}-${String(start + offset).padStart(2, '0')}`)).some(predicate)).map(row => row.employeeName)
      return { label, people }
    })
    return { label: `Tuần ${index + 1}`, events }
  }), [calendar.length, month, rows])

  if (loading || monthLoading) return <div className="attendance-preview-state">Đang lấy dữ liệu mới nhất...</div>
  if (error) return <div className="attendance-preview-state is-error">{error}</div>
  return <div className="attendance-preview-page">
    <header><div><h1>Bảng công {month}</h1><p>Dữ liệu database tại thời điểm mở trang · Không realtime</p></div><label>Tháng<select value={month} onChange={event => setMonth(event.target.value)}>{months.map(value => <option key={value}>{value}</option>)}</select></label></header>
    <div className="attendance-preview-scroll"><table className="attendance-preview-table">
      <thead>
        <tr className="totals"><th colSpan="11"></th><th>{totals.under30 || 0}</th><th>{money(totals.lateFine)}</th><th>{totals.over30 || 0}</th><th>{money(totals.overFine)}</th><th>{totals.missing || 0}</th><th>{money(totals.missingFine)}</th><th colSpan="5"></th><th>{money(totals.absenceFine)}</th><th></th><th>{money(totals.total)}</th><th colSpan="2"></th><th>{totals.overtime || 0}</th><th>{totals.leave || 0}</th><th></th><th>{totals.probation || 0}</th><th>{totals.official || 0}</th><th colSpan="2"></th><th>{totals.workdays || 0}</th><th colSpan={calendar.length}></th></tr>
        <tr className="groups"><th rowSpan="2">STT</th><th rowSpan="2">Xác nhận</th><th colSpan="3">Thông tin nhân sự</th><th rowSpan="2">Loại HĐ</th><th rowSpan="2">Trạng thái</th><th rowSpan="2">Ngày nhận việc</th><th rowSpan="2">Ngày chính thức</th><th rowSpan="2">Ngày làm việc cuối</th><th rowSpan="2">Notes</th><th colSpan="14">Phạt Nội quy</th><th rowSpan="2">Vé xe</th><th rowSpan="2">Phép còn lại</th><th rowSpan="2">Tăng ca</th><th rowSpan="2">Phép sử dụng</th><th rowSpan="2">Học việc</th><th rowSpan="2">Thử việc</th><th rowSpan="2">Chính thức</th><th rowSpan="2">Công làm lễ</th><th rowSpan="2">Công lễ</th><th rowSpan="2">Tổng công</th>{calendar.map(item => <th key={`w${item.day}`}>{item.weekday}</th>)}</tr>
        <tr className="columns"><th>Họ tên</th><th>Bộ phận</th><th>Ca làm</th><th>Muộn/sớm &lt;30p</th><th>Phạt</th><th>Muộn/sớm ≥30p</th><th>Phạt</th><th>Quên chấm</th><th>Phạt</th><th>Không trực nhật</th><th>Phạt</th><th>Nghỉ đột xuất</th><th>Phạt</th><th>Nghỉ không phép</th><th>Phạt</th><th>Say xỉn</th><th>Tổng phạt</th>{calendar.map(item => <th key={item.day}>{item.day}</th>)}</tr>
      </thead><tbody>{rows.map((row, index) => { const fine = penalties(row); return <tr key={row.employeeId}><td>{index + 1}</td><td></td><td className="name">{row.employeeName}</td>{departmentRowSpans[index] > 0 && <td rowSpan={departmentRowSpans[index]}>{row.displayDepartment}</td>}<td>{row.shift}</td><td>{contractType(row)}</td><td>{row.employmentStatus}</td><td>{dateText(row.joinDate)}</td><td>{dateText(row.officialDate)}</td><td>{dateText(row.lastWorkingDate)}</td><td>{row.lateCount ? `${row.lateCount} lần (${row.lateMinutes}p)` : ''}</td><td>{fine.under30}</td><td>{money(fine.lateFine)}</td><td>{fine.over30}</td><td>{money(fine.overFine)}</td><td>{fine.missing}</td><td>{money(fine.missingFine)}</td><td></td><td></td><td></td><td></td><td>{fine.absence}</td><td>{money(fine.absenceFine)}</td><td></td><td className="fine">{money(fine.total)}</td><td></td><td></td><td>{row.overtimeHours || ''}</td><td>{row.paidLeaveWorkdays || ''}</td><td></td><td>{row.probationWorkdays || ''}</td><td>{row.officialWorkdays || ''}</td><td></td><td></td><td>{row.workdays || ''}</td>{calendar.map(item => <td key={item.day} className="day">{dayCode(row.days.get(`${month}-${String(item.day).padStart(2, '0')}`))}</td>)}</tr> })}</tbody>
    </table></div>
    <section className="attendance-preview-weeks">{weekly.map(week => <article key={week.label}><h3>{week.label}</h3>{week.events.map(event => <div key={event.label}><strong>{event.label}: {event.people.length}</strong><span>{event.people.join(', ') || 'Không có'}</span></div>)}</article>)}</section>
    <section className="attendance-preview-legend"><strong>Chú thích:</strong><span>X: Nghỉ theo lịch/không phép theo trạng thái</span><span>P1: Nghỉ phép năm</span><span>1 / 0.5: Công trong ngày</span></section>
  </div>
}

export default AttendancePreview
