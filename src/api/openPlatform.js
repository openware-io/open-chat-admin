import request from './request'

// ─── 开放平台第三方接入管理 ───
export function getApplications(params) {
  return request.get('/admin/open-platform/applications', { params })
}

export function getApplication(appId) {
  return request.get('/admin/open-platform/applications/' + appId)
}

export function approveApplication(appId) {
  return request.post('/admin/open-platform/applications/' + appId + '/approve')
}

export function rejectApplication(appId, reason) {
  return request.post('/admin/open-platform/applications/' + appId + '/reject', { reason })
}

export function resetSecret(appId) {
  return request.post('/admin/open-platform/applications/' + appId + '/reset-secret')
}

export function revokeApplication(appId) {
  return request.post('/admin/open-platform/applications/' + appId + '/revoke')
}
