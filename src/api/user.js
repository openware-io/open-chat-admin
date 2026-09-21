import request from './request'

export function getUsers(params) {
  return request.get('/admin/users', { params })
}

export function getUserById(id) {
  return request.get(`/admin/users/${id}`)
}

export function updateUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, { status })
}

// 删除用户（硬删 + 级联清理，消息本体保留）。
// 必须带 confirmUsername 且服务端会再次比对账号当前用户名，不一致返回 400 USERNAME_CONFIRM_MISMATCH。
export function deleteUser(id, confirmUsername) {
  return request.delete(`/admin/users/${id}`, { data: { confirmUsername } })
}
