import request from './request'

export function getDeviceTokens(params) {
  return request.get('/admin/device-tokens', { params })
}

export function deleteDeviceToken(id) {
  return request.delete(`/admin/device-tokens/${id}`)
}
