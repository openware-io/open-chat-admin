import request from './request'

export function getKeywords(params) {
  return request.get('/admin/security/sensitive-words', { params })
}

export function addKeyword(data) {
  return request.post('/admin/security/sensitive-words', data)
}

export function updateKeyword(id, data) {
  return request.put(`/admin/security/sensitive-words/${id}`, data)
}

export function deleteKeyword(id) {
  return request.delete(`/admin/security/sensitive-words/${id}`)
}

export function getViolations(params) {
  return request.get('/admin/security/violations', { params })
}

export function createViolation(data) {
  return request.post('/admin/security/violations', data)
}

export function getReports(params) {
  return request.get('/admin/security/reports', { params })
}

export function handleReport(id, data) {
  return request.put(`/admin/security/reports/${id}`, data)
}

export function getPendingReportCount() {
  return request.get('/admin/security/reports/pending/count')
}
