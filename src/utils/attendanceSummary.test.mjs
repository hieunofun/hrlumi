import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAttendanceSummary } from './attendanceSummary.js'

test('keeps an unmatched source employee in the monthly attendance summary', () => {
  const rows = buildAttendanceSummary({
    attendanceLogs: [{
      employeeId: 'external:00002::nguyenbuikhanhvan',
      employeeCode: '00002',
      employeeName: 'Nguyễn Bùi Khánh Vân',
      sourceEmployeeCode: '00002',
      sourceEmployeeName: 'Nguyễn Bùi Khánh Vân',
      department: 'Văn phòng',
      date: '2026-08-01',
      cong: 0.9,
      congPlus: 0,
      hours: 7.2,
      vao: '08:20',
      ra: '17:30'
    }],
    employees: [],
    month: '2026-08'
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].employeeCode, '00002')
  assert.equal(rows[0].employeeName, 'Nguyễn Bùi Khánh Vân')
  assert.equal(rows[0].department, 'Văn phòng')
  assert.equal(rows[0].workdays, 0.9)
  assert.equal(rows[0].days.get('2026-08-01').hours, 7.2)
})
