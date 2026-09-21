import request from './request'

export function getMessages(params) {
  return request.get('/admin/messages', { params })
}

export function getMessageTrend(days = 30) {
  return request.get('/admin/messages/trend', { params: { days } })
}
