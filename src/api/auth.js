import request, { publicRequest } from './request'

export function login(data) {
  return request.post('/auth/login', data)
}

export function ssoLogin(ticket) {
  return request.post('/auth/sso', { ticket })
}

export function forgotPassword(email) {
  return publicRequest.post('/auth/password/forgot', { email })
}

export function resetPassword(token, newPassword) {
  return publicRequest.post('/auth/password/reset', { token, newPassword })
}
