import request from './request'

export function getGroupList(params) {
  return request.get('/admin/groups', { params })
}

export function getGroupMembers(id) {
  return request.get(`/admin/groups/${id}/members`)
}

export function dissolveGroup(id) {
  return request.delete(`/admin/groups/${id}`)
}
