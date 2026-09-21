import request from './request'

export function getUserStickers(params) {
  return request.get('/admin/user-stickers', { params })
}

export function deleteUserSticker(id) {
  return request.delete(`/admin/user-stickers/${id}`)
}
