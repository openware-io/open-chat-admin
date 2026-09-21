import request from './request'

export function getAllConfigs() {
  return request.get('/admin/config')
}

export function updateConfig(data) {
  return request.put('/admin/config', data)
}

export function batchUpdateConfigs(configs) {
  return request.post('/admin/config/batch', { configs })
}
