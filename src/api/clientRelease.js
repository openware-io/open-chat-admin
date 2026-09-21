import request from './request'

const write = (method, url, data, errorContext) => request({ method, url, data, errorContext, headers: { 'Idempotency-Key': crypto.randomUUID() } })

export function getClientReleases(params) { return request.get('/admin/client-releases', { params }) }
// 上传发布制品：预签名直传对象存储（不经服务端中转，支持大文件/1GB），返回 downloadUrl/sha256/sizeBytes
export async function uploadReleaseArtifact(file, platform) {
  const fileName = file.name || 'artifact.bin'
  const contentType = file.type || contentTypeFor(fileName)
  const createResp = await request.post('/admin/client-releases/artifacts/upload-sessions', {
    platform, fileName, contentType,
  })
  const session = createResp && createResp.data ? createResp.data : createResp
  if (!session || !session.uploadUrl) throw new Error('create upload session failed')
  await putObject(session.uploadUrl, file, contentType)
  return request.post('/admin/client-releases/artifacts/upload-sessions/complete', {
    platform, fileName, contentType, objectKey: session.objectKey,
  })
}

function contentTypeFor(fileName) {
  const name = (fileName || '').toLowerCase()
  if (name.endsWith('.apk')) return 'application/vnd.android.package-archive'
  if (name.endsWith('.aab')) return 'application/octet-stream'
  if (name.endsWith('.exe')) return 'application/x-msdownload'
  if (name.endsWith('.dmg')) return 'application/x-apple-diskimage'
  if (name.endsWith('.msix')) return 'application/octet-stream'
  if (name.endsWith('.pkg')) return 'application/octet-stream'
  return 'application/octet-stream'
}

function putObject(url, file, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream')
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Object storage upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Object storage upload failed'))
    xhr.onabort = () => reject(new Error('Object storage upload was cancelled'))
    xhr.send(file)
  })
}
export function getClientRelease(id) { return request.get(`/admin/client-releases/${id}`) }
export function createClientRelease(data) { return write('post', '/admin/client-releases', data, '创建发布草稿') }
export function updateClientRelease(id, data) { return write('put', `/admin/client-releases/${id}`, data, '更新发布草稿') }
export function getClientReleasePolicies() { return request.get('/admin/client-release-policies') }
export function getClientReleaseAuditLogs(id, params) { return request.get(`/admin/client-releases/${id}/audit-logs`, { params }) }
export function getClientReleasePlatforms() { return request.get('/admin/client-release-platforms') }
export function submitClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/submit`, data, '提交发布') }
export function rolloutClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/rollout`, data, '调整灰度发布') }
export function pauseClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/pause`, data, '暂停发布') }
export function resumeClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/resume`, data, '恢复发布') }
export function withdrawClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/withdraw`, data, '撤回发布') }
export function archiveClientRelease(id, data) { return write('post', `/admin/client-releases/${id}/archive`, data, '归档发布') }
