import request from './request'

// ─── 服务类型 ───
export function getServiceTypes() {
  return request.get('/admin/miniapp/service-types')
}

export function createServiceType(data) {
  return request.post('/admin/miniapp/service-types', data)
}

export function updateServiceType(id, data) {
  return request.put(`/admin/miniapp/service-types/${id}`, data)
}

export function deleteServiceType(id) {
  return request.delete(`/admin/miniapp/service-types/${id}`)
}

export function batchSortServiceTypes(items) {
  return request.post('/admin/miniapp/service-types/sort', { items })
}

// ─── 服务项 ───
export function getServices(params) {
  return request.get('/admin/miniapp/services', { params })
}

export function createService(data) {
  return request.post('/admin/miniapp/services', data)
}

export function updateService(id, data) {
  return request.put(`/admin/miniapp/services/${id}`, data)
}

export function deleteService(id) {
  return request.delete(`/admin/miniapp/services/${id}`)
}
