import request from './request'

export function getFriends(params) {
  return request.get('/admin/friends', { params })
}
