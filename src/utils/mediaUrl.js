/**
 * 将服务端返回的上传相对路径转为管理端可加载的绝对地址。
 * 开发环境依赖 Vite 代理 /uploads；生产可设 VITE_API_ORIGIN。
 */
export function resolveUploadUrl(path) {
  if (!path || typeof path !== 'string') return ''
  const p = path.trim()
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return ''
}
