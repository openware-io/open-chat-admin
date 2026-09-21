import request from './request'

export function getAccountCancellations(params) {
  return request.get('/admin/account-cancellations', { params })
}

export function getAccountCancellationLogs(id) {
  return request.get(`/admin/account-cancellations/${id}/logs`)
}

export function searchAccountCancellationLogs(params) {
  return request.get('/admin/account-cancellations/logs', { params })
}
