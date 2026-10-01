// Quote CSV cells and neutralize spreadsheet formulas in user-entered text.
function csvCell(value) {
  const text = String(value ?? '')
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function reportCsv(result) {
  const rows = [
    ['Metric', 'Value'],
    ['Test', result.testName],
    ['Submitted at', result.submittedAt],
    ['Score', result.score],
    ['Total marks', result.totalMarks],
    ['Percentage', result.percentage],
    ['Correct', result.correct],
    ['Wrong', result.wrong],
    ['Unattempted', result.unattempted],
    ['Time taken (minutes)', result.timeTaken],
    [],
    ['Subject', 'Correct', 'Wrong', 'Total'],
    ...Object.entries(result.subjectBreakdown || {}).map(([subject, data]) => [subject, data.correct, data.wrong, data.total]),
    [],
    ['Topic', 'Correct', 'Wrong', 'Total'],
    ...Object.entries(result.topicBreakdown || {}).map(([topic, data]) => [topic, data.correct, data.wrong, data.total]),
  ]
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadReport(result) {
  const url = URL.createObjectURL(new Blob([reportCsv(result)], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'nexprep-report.csv'
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
