import assert from 'node:assert/strict'
import test from 'node:test'
import { matchAttendanceEmployee } from './attendanceMatching.js'

test('does not auto-match a machine code collision when employee names differ', () => {
  const wrongEmployee = {
    id: 'wrong-profile',
    employeeId: '00019',
    ho_va_ten: 'Nguyễn Thị Hồng Thắm'
  }

  const match = matchAttendanceEmployee(
    '00019',
    'Nguyễn Thị Phương Anh',
    [wrongEmployee]
  )

  assert.equal(match.employee, null)
  assert.ok(match.confidence < 0.9)
  assert.equal(match.method, 'Mã trùng nhưng tên không khớp')
})

test('prefers an exact name over a colliding machine code', () => {
  const wrongEmployee = {
    id: 'wrong-profile',
    employeeId: '00019',
    ho_va_ten: 'Nguyễn Thị Hồng Thắm'
  }
  const correctEmployee = {
    id: 'correct-profile',
    employeeId: 'LU099',
    ho_va_ten: 'Nguyễn Thị Phương Anh'
  }

  const match = matchAttendanceEmployee(
    '00019',
    'Nguyễn Thị Phương Anh',
    [wrongEmployee, correctEmployee]
  )

  assert.equal(match.employee?.id, 'correct-profile')
  assert.equal(match.method, 'Tên trùng → gán mã nhân viên Lumi')
})

test('still auto-matches when both employee code and name agree', () => {
  const employee = {
    id: 'correct-profile',
    employeeId: 'LU035',
    ho_va_ten: 'Đặng Thùy Liên'
  }

  const match = matchAttendanceEmployee('LU035', 'Đặng Thùy Liên', [employee])

  assert.equal(match.employee?.id, 'correct-profile')
  assert.equal(match.status, 'matched')
})
