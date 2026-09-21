import request from './request'

export function getOnlineCount() {
  return request.get('/admin/monitor/online')
}

export function getOnlineUsers() {
  return request.get('/admin/monitor/online/users')
}

export function getCallRooms() {
  return request.get('/admin/monitor/calls')
}

export function endCall(callId) {
  return request.post(`/admin/monitor/calls/${callId}/end`)
}

export function getServerStats() {
  return request.get('/admin/monitor/server')
}
