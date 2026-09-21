import request from './request'

// IM 后台审计日志（透传 common-audit-service，与 SaaS 后台同一套审计）。
// 支持筛选：动作码、资源类型、操作人关键字、结果、时间区间（from/to 支持 YYYY-MM-DD）。
export function getAuditLogs(params) {
  return request.get('/admin/audit-logs', { params })
}
