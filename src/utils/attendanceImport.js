const normalizeHeader = value => String(value || '').toLowerCase().trim()

/**
 * Locate only real punch columns (Vào/Ra, Vào 1/Ra 1, ...).
 * Summary columns such as "Vào trễ" and "Ra sớm" must not be treated as punches.
 */
export const findAttendancePunchColumns = (headers = []) =>
  headers.reduce((columns, header, index) => {
    const normalized = normalizeHeader(header)
    if (/^(?:vào|vao)\s*\d*$/.test(normalized)) {
      columns.checkInIndexes.push(index)
      columns.allIndexes.push(index)
    } else if (/^ra\s*\d*$/.test(normalized)) {
      columns.checkOutIndexes.push(index)
      columns.allIndexes.push(index)
    }
    return columns
  }, { checkInIndexes: [], checkOutIndexes: [], allIndexes: [] })

export const collectAttendancePunches = (
  row = [],
  columns = { checkInIndexes: [], checkOutIndexes: [], allIndexes: [] },
  parseValue = value => value
) => {
  const parsedAt = index => {
    const parsed = parseValue(row[index])
    return typeof parsed === 'string' ? parsed : parsed?.str || ''
  }
  const checkIns = columns.checkInIndexes.map(parsedAt).filter(Boolean)
  const checkOuts = columns.checkOutIndexes.map(parsedAt).filter(Boolean)
  const punches = columns.allIndexes.map(parsedAt).filter(Boolean)

  return {
    checkIn: checkIns[0] || '',
    checkOut: checkOuts[checkOuts.length - 1] || '',
    punches
  }
}
