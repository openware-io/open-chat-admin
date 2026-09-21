import request from './request'

const activationTimeoutMs = 60_000
const activationPollIntervalMs = 800
const multipartThresholdBytes = 20 * 1024 * 1024

export function createMediaUploadTask(file, options = {}) {
  if (!(file instanceof Blob) || !options.scope || !options.mediaKind) {
    throw new Error('Invalid media upload request')
  }
  return new MediaUploadTask(file, options)
}

export async function uploadMedia(file, options = {}) {
  return createMediaUploadTask(file, options).start()
}

export async function getMediaAccessUrl(objectId) {
  if (!objectId) return ''
  const result = await request.get(`/media/${encodeURIComponent(objectId)}/access`)
  return result.url || ''
}

class MediaUploadTask {
  constructor(file, { scope, mediaKind, onProgress } = {}) {
    this.file = file
    this.scope = scope
    this.mediaKind = mediaKind
    this.onProgress = onProgress
    this.sha256 = null
    this.session = null
    this.uploadedParts = new Map()
    this.activeRequests = new Set()
    this.cancelled = false
  }

  async start() {
    this.cancelled = false
    this.sha256 ||= await digest(this.file)
    if (!this.session) await this.createSession()
    return this.session.multipart ? this.uploadMultipart() : this.uploadSingle()
  }

  async resume() {
    if (!this.session?.multipart) return this.start()
    this.cancelled = false
    const status = await request.get(`/media/multipart-upload-sessions/${this.session.uploadSessionId}`)
    this.session = { ...this.session, ...status }
    this.uploadedParts = new Map((status.uploadedParts || []).map(({ partNumber, etag }) => [partNumber, etag]))
    return this.uploadMultipart()
  }

  async retry() {
    if (!this.session) return this.start()
    if (this.session.multipart) {
      try {
        return await this.resume()
      } catch (error) {
        if (![404, 409].includes(error?.response?.status)) throw error
        this.session = null
        this.uploadedParts.clear()
        return this.start()
      }
    }
    await this.cancel().catch(() => {})
    this.session = null
    return this.start()
  }

  async cancel() {
    this.cancelled = true
    this.activeRequests.forEach((xhr) => xhr.abort())
    this.activeRequests.clear()
    if (!this.session?.uploadSessionId) return
    const base = this.session.multipart ? '/media/multipart-upload-sessions' : '/media/upload-sessions'
    await request.delete(`${base}/${this.session.uploadSessionId}`)
  }

  async createSession() {
    const body = {
      scope: this.scope,
      mediaKind: this.mediaKind,
      fileName: this.file instanceof File ? this.file.name : 'upload',
      contentType: this.file.type || 'application/octet-stream',
      size: this.file.size,
      sha256: this.sha256,
    }
    const multipart = this.file.size > multipartThresholdBytes
    const session = await request.post(
      multipart ? '/media/multipart-upload-sessions' : '/media/upload-sessions',
      body,
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    this.session = { ...session, multipart }
  }

  async uploadSingle() {
    await this.put(this.session.uploadUrl, this.file, this.session.requiredHeaders, (uploadedBytes) => {
      this.reportProgress(uploadedBytes)
    }, false)
    this.ensureNotCancelled()
    await request.post(`/media/upload-sessions/${this.session.uploadSessionId}/complete`, {
      size: this.file.size,
      sha256: this.sha256,
    }, { headers: { 'Idempotency-Key': crypto.randomUUID() } })
    await waitUntilActive(this.session.objectId)
    return { objectId: this.session.objectId }
  }

  async uploadMultipart() {
    const partNumbers = Array.from({ length: this.session.partCount }, (_, index) => index + 1)
    const pendingParts = partNumbers.filter((partNumber) => !this.uploadedParts.has(partNumber))
    const signatures = pendingParts.length === 0 ? { partUrls: [] } : await request.post(
      `/media/multipart-upload-sessions/${this.session.uploadSessionId}/parts/signatures`,
      { partNumbers: pendingParts },
    )
    const uploadedBytes = () => [...this.uploadedParts.keys()]
      .reduce((total, partNumber) => total + this.partSize(partNumber), 0)
    for (const part of signatures.partUrls || []) {
      this.ensureNotCancelled()
      const blob = this.file.slice((part.partNumber - 1) * this.session.partSize, part.partNumber * this.session.partSize)
      const etag = await this.put(part.uploadUrl, blob, {}, () => {
        this.reportProgress(uploadedBytes() + blob.size)
      }, true)
      this.ensureNotCancelled()
      await request.post(`/media/multipart-upload-sessions/${this.session.uploadSessionId}/parts/${part.partNumber}/complete`, { etag })
      this.uploadedParts.set(part.partNumber, etag)
      this.reportProgress(uploadedBytes())
    }
    this.ensureNotCancelled()
    if (this.uploadedParts.size !== this.session.partCount || [...this.uploadedParts.values()].some((etag) => !etag)) {
      throw new Error('Cannot complete a resumed multipart upload without part ETags; please retry the upload')
    }
    const parts = [...this.uploadedParts.entries()]
      .map(([partNumber, etag]) => ({ partNumber, etag }))
      .sort((left, right) => left.partNumber - right.partNumber)
    await request.post(`/media/multipart-upload-sessions/${this.session.uploadSessionId}/complete`, {
      parts,
      size: this.file.size,
      sha256: this.sha256,
    })
    await waitUntilActive(this.session.objectId)
    return { objectId: this.session.objectId }
  }

  partSize(partNumber) {
    const offset = (partNumber - 1) * this.session.partSize
    return Math.min(this.session.partSize, this.file.size - offset)
  }

  reportProgress(uploadedBytes) {
    if (this.onProgress) this.onProgress(Math.round(uploadedBytes * 100 / this.file.size))
  }

  put(url, file, requiredHeaders, onProgress, requireEtag) {
    return put(url, file, requiredHeaders, onProgress, () => this.cancelled, requireEtag,
      (xhr) => this.activeRequests.add(xhr), (xhr) => this.activeRequests.delete(xhr))
  }

  ensureNotCancelled() {
    if (this.cancelled) throw new Error('Media upload was cancelled')
  }
}

async function digest(file) {
  const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('')
}

function put(url, file, requiredHeaders = {}, onProgress, isCancelled, requireEtag = false, onCreated, onFinished) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const finish = () => onFinished?.(xhr)
    onCreated?.(xhr)
    xhr.open('PUT', url)
    Object.entries(requiredHeaders || {}).forEach(([name, value]) => xhr.setRequestHeader(name, value))
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded)
    }
    xhr.onerror = () => { finish(); reject(new Error('Object storage upload failed')) }
    xhr.onabort = () => { finish(); reject(new Error('Media upload was cancelled')) }
    xhr.onload = () => {
      finish()
      if (isCancelled?.()) return reject(new Error('Media upload was cancelled'))
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`Object storage upload failed (${xhr.status})`))
      const etag = xhr.getResponseHeader('ETag')
      if (requireEtag && !etag) return reject(new Error('Object storage did not expose the multipart ETag'))
      resolve(etag)
    }
    xhr.send(file)
  })
}

async function waitUntilActive(objectId) {
  const deadline = Date.now() + activationTimeoutMs
  while (Date.now() < deadline) {
    const media = await request.get(`/media/${encodeURIComponent(objectId)}`)
    if (media.status === 'active') return
    if (media.status === 'rejected' || media.status === 'deleted') throw new Error('Media validation was rejected')
    await new Promise((resolve) => window.setTimeout(resolve, activationPollIntervalMs))
  }
  throw new Error('Media validation timed out')
}
