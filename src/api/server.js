import request from './request'

export function getServerMetrics() {
  return request.get('/admin/server/metrics')
}

export function getServerNodes() {
  return request.get('/admin/server/nodes')
}

export function getLogs(params) {
  return request.get('/admin/server/logs', { params })
}
