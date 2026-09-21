import { ElMessage } from 'element-plus'

const ERROR_CODE_MESSAGES = Object.freeze({
  CLIENT_RELEASE_DOWNLOAD_HOST_NOT_ALLOWED: '下载地址域名未获准发布，请使用已配置的官方分发地址。',
  CLIENT_RELEASE_PLATFORM_NOT_ENABLED: '该客户端平台尚未启用发布，请确认平台配置。',
  CLIENT_RELEASE_INVALID_REQUEST: '发布信息校验未通过，请检查表单内容后重试。',
  CLIENT_RELEASE_INVALID_STATE: '当前发布状态不允许执行此操作，请刷新后重试。',
  CLIENT_RELEASE_NOT_FOUND: '发布记录不存在或已被移除，请刷新列表后重试。',
  CLIENT_RELEASE_IDEMPOTENCY_REUSED: '本次操作已被处理，请刷新页面确认结果。',
  SSO_IDAAS_TOKEN_INVALID: '统一登录令牌无效或已过期，请重新从门户登录。',
  SSO_ADMIN_ACCOUNT_NOT_FOUND: '当前集团账号未映射到 IM 后台管理员账号。',
  SSO_ADMIN_ACCOUNT_DISABLED: '映射的 IM 后台管理员账号已被禁用。',
  // 用户删除（IM 后台「用户管理 → 删除」）：后端码与中文原因一一对应，页面不直接展示后端原文。
  ADMIN_ACCOUNT_UNDELETABLE: '管理员账号不允许删除，请改用禁用。',
  USERNAME_CONFIRM_MISMATCH: '输入的用户名与当前账号不一致，未执行删除。',
  CANNOT_DELETE_SELF: '不能删除当前登录的管理员账号。',
  USER_NOT_FOUND: '账号不存在或已被删除，请刷新列表后重试。',
  TIME_RANGE_INVALID: '时间区间不合法，起始时间不能晚于结束时间。',
})

const STATUS_MESSAGES = Object.freeze({
  400: '提交内容校验未通过，请检查后重试。',
  403: '当前账号没有执行此操作的权限。',
  404: '请求的资源不存在或已被移除。',
  409: '数据已被其他管理员更新，请刷新后重试。',
  429: '操作过于频繁，请稍后再试。',
  500: '服务暂时不可用，请稍后重试。',
})

export function resolveAdminErrorMessage(error) {
  const response = error?.response
  const code = response?.data?.code
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code]
  }
  if (response?.status && STATUS_MESSAGES[response.status]) {
    return STATUS_MESSAGES[response.status]
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return '请求超时，请检查网络后重试。'
  }
  if (!response) {
    return '网络连接异常，请检查网络后重试。'
  }
  return '操作未完成，请稍后重试。'
}

export function notifyAdminRequestError(error) {
  const operation = error?.config?.errorContext
  const message = resolveAdminErrorMessage(error)
  error.adminDisplayMessage = operation ? `${operation}失败：${message}` : message
  ElMessage.error(error.adminDisplayMessage)
  return error.adminDisplayMessage
}
