<template>
  <div class="admin-page">
    <div class="page-header"><h2>客户端发布治理</h2><p class="hint">创建时可选「直接发布」或「预发布」：直接发布立即对全部用户上线；预发布则填写定时上线时间（可灰度）。Android、iOS、Windows 和 macOS 当前可发布，Linux 为预留状态。</p></div>
    <div class="admin-card">
      <div class="filter-bar">
        <el-select v-model="platform" style="width: 130px" @change="load"><el-option label="Android" value="android"/><el-option label="iOS" value="ios"/><el-option label="Windows" value="windows"/><el-option label="macOS" value="macos"/></el-select>
        <el-select v-model="channel" style="width: 120px" @change="load"><el-option label="Internal" value="internal"/><el-option label="Beta" value="beta"/><el-option label="Stable" value="stable"/></el-select>
        <el-button @click="load">查询</el-button><el-button type="primary" @click="openCreate">创建发布</el-button>
      </div>
      <el-table :data="items" v-loading="loading" border>
        <el-table-column label="序号" width="64" align="center">
          <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="70"/>
        <el-table-column prop="platform" label="平台" width="80"/>
        <el-table-column prop="channel" label="渠道" width="80"/>
        <el-table-column prop="version" label="版本" width="90"/>
        <el-table-column prop="buildNumber" label="构建号" width="80"/>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="灰度" width="80" align="center">
          <template #default="{ row }">{{ row.rolloutPercent ?? 0 }}%</template>
        </el-table-column>
        <el-table-column label="计划发布" width="150"><template #default="{ row }">{{ fmt(row.scheduledAt) }}</template></el-table-column>
        <el-table-column label="发布时间" width="150"><template #default="{ row }">{{ fmt(row.publishedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'draft'" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" text type="primary" @click="openSubmit(row)">提交</el-button>
            <el-button v-if="['draft','scheduled'].includes(row.status)" text type="warning" @click="state(row, 'archive')">归档</el-button>
            <el-button v-if="row.status === 'rolling_out'" text type="primary" @click="rollout(row)">扩大灰度</el-button>
            <el-button v-if="row.status === 'rolling_out'" text type="warning" @click="state(row, 'pause')">暂停</el-button>
            <el-button v-if="row.status === 'paused'" text type="primary" @click="state(row, 'resume')">恢复</el-button>
            <el-button v-if="!['withdrawn','archived'].includes(row.status)" text type="danger" @click="state(row, 'withdraw')">撤回</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="admin-pagination"
        @size-change="handlePageSizeChange"
        @current-change="load"
      />
    </div>

    <!-- 创建发布（直接发布 / 预发布） -->
    <el-dialog v-model="createVisible" title="创建发布" width="680px">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="发布方式">
          <el-radio-group v-model="createForm.mode">
            <el-radio-button value="direct">直接发布</el-radio-button>
            <el-radio-button value="pre">预发布</el-radio-button>
          </el-radio-group>
          <div class="hint">直接发布：创建后立即对全部用户上线；预发布：填写定时上线时间，到点自动发布（可先灰度部分用户）。</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="平台"><el-select v-model="createForm.platform"><el-option label="Android" value="android"/><el-option label="iOS" value="ios"/><el-option label="Windows" value="windows"/><el-option label="macOS" value="macos"/></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="渠道"><el-select v-model="createForm.channel"><el-option label="Internal" value="internal"/><el-option label="Beta" value="beta"/><el-option label="Stable" value="stable"/></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="版本"><el-input v-model="createForm.version" placeholder="1.2.3"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="构建号"><el-input-number v-model="createForm.buildNumber" :min="1"/></el-form-item></el-col>
        </el-row>
        <el-form-item label="更新说明"><el-input v-model="createForm.releaseNotes" type="textarea"/></el-form-item>
        <el-form-item label="制品类型">
          <el-select v-model="createForm.packageType" :disabled="createForm.platform === 'ios'">
            <el-option v-if="createForm.platform === 'android'" label="Google Play" value="google-play"/>
            <el-option v-if="createForm.platform === 'ios'" label="App Store" value="app-store"/>
            <el-option v-if="createForm.platform === 'android'" label="APK（直装）" value="apk"/>
            <el-option v-if="createForm.platform === 'windows'" label="EXE" value="exe"/>
            <el-option v-if="createForm.platform === 'windows'" label="MSIX" value="msix"/>
            <el-option v-if="createForm.platform === 'macos'" label="DMG" value="dmg"/>
            <el-option v-if="createForm.platform === 'macos'" label="PKG" value="pkg"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="isStore(createForm.packageType)" label="商店地址（HTTPS）"><el-input v-model="createForm.storeUrl" placeholder="https://play.google.com/store/apps/details?id=..."/></el-form-item>
        <el-form-item v-else label="上传文件（自动填充下方三项）"><el-upload :show-file-list="false" :http-request="httpUploadCreate"><el-button type="primary" plain :loading="uploading">选择文件并上传</el-button></el-upload></el-form-item>
        <el-form-item v-if="!isStore(createForm.packageType)" label="下载地址（HTTPS）"><el-input v-model="createForm.downloadUrl" placeholder="https://example.com/download/wv-chat-1.0.17.apk"/></el-form-item>
        <el-form-item v-if="!isStore(createForm.packageType)" label="SHA-256（64 位小写十六进制）"><el-input v-model="createForm.sha256" placeholder="b6d3dc17a1d1355f9bf155af7d0b7c3e4e66b037dac2ea71bc0852004973f5b5"/></el-form-item>
        <el-form-item v-if="!isStore(createForm.packageType)" label="文件大小（字节）"><el-input-number v-model="createForm.sizeBytes" :min="1" :step="1" style="width: 100%"/></el-form-item>

        <!-- 预发布相关表单 -->
        <template v-if="createForm.mode === 'pre'">
          <el-form-item label="定时上线时间">
            <el-date-picker v-model="createForm.scheduledAt" type="datetime" placeholder="选择定时上线时间（必填）" value-format="YYYY-MM-DDTHH:mm:ss" :disabled-date="disablePast" style="width: 100%"/>
          </el-form-item>
          <el-form-item label="灰度比例（%）"><el-input-number v-model="createForm.grayPercent" :min="1" :max="100"/></el-form-item>
        </template>
      </el-form>
      <template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="createSubmit">{{ createForm.mode === 'pre' ? '创建预发布' : '直接发布' }}</el-button></template>
    </el-dialog>

    <!-- 编辑草稿 -->
    <el-dialog v-model="draftVisible" title="编辑发布草稿" width="680px">
      <el-form :model="form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="平台"><el-select v-model="form.platform" disabled><el-option label="Android" value="android"/><el-option label="iOS" value="ios"/><el-option label="Windows" value="windows"/><el-option label="macOS" value="macos"/></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="渠道"><el-select v-model="form.channel" disabled><el-option label="Internal" value="internal"/><el-option label="Beta" value="beta"/><el-option label="Stable" value="stable"/></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="版本"><el-input v-model="form.version" placeholder="1.2.3"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="构建号"><el-input-number v-model="form.buildNumber" :min="1"/></el-form-item></el-col>
        </el-row>
        <el-form-item label="更新说明"><el-input v-model="form.releaseNotes" type="textarea"/></el-form-item>
        <el-form-item label="制品类型">
          <el-select v-model="form.packageType" :disabled="form.platform === 'ios'">
            <el-option v-if="form.platform === 'android'" label="Google Play" value="google-play"/>
            <el-option v-if="form.platform === 'ios'" label="App Store" value="app-store"/>
            <el-option v-if="form.platform === 'android'" label="APK（直装）" value="apk"/>
            <el-option v-if="form.platform === 'windows'" label="EXE" value="exe"/>
            <el-option v-if="form.platform === 'windows'" label="MSIX" value="msix"/>
            <el-option v-if="form.platform === 'macos'" label="DMG" value="dmg"/>
            <el-option v-if="form.platform === 'macos'" label="PKG" value="pkg"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="isStore(form.packageType)" label="商店地址（HTTPS）"><el-input v-model="form.storeUrl" placeholder="https://play.google.com/store/apps/details?id=..."/></el-form-item>
        <el-form-item v-else label="上传文件（自动填充下方三项）"><el-upload :show-file-list="false" :http-request="httpUploadEdit"><el-button type="primary" plain :loading="uploading">选择文件并上传</el-button></el-upload></el-form-item>
        <el-form-item v-if="!isStore(form.packageType)" label="下载地址（HTTPS）"><el-input v-model="form.downloadUrl" placeholder="https://example.com/download/wv-chat-1.0.17.apk"/></el-form-item>
        <el-form-item v-if="!isStore(form.packageType)" label="SHA-256（64 位小写十六进制）"><el-input v-model="form.sha256" placeholder="b6d3dc17a1d1355f9bf155af7d0b7c3e4e66b037dac2ea71bc0852004973f5b5"/></el-form-item>
        <el-form-item v-if="!isStore(form.packageType)" label="文件大小（字节）"><el-input-number v-model="form.sizeBytes" :min="1" :step="1" style="width: 100%"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="draftVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveDraft">保存修改</el-button></template>
    </el-dialog>

    <!-- 提交已有草稿（立即 / 定时） -->
    <el-dialog v-model="submitVisible" title="提交发布" width="520px">
      <el-form :model="submitForm" label-position="top">
        <el-form-item label="灰度比例"><el-input-number v-model="submitForm.percent" :min="1" :max="100"/></el-form-item>
        <el-form-item label="定时发布时间（不填则立即发布）">
          <el-date-picker v-model="submitForm.scheduledAt" type="datetime" placeholder="选择定时发布时间" value-format="YYYY-MM-DDTHH:mm:ss" :disabled-date="disablePast" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="变更原因"><el-input v-model="submitForm.reason" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="submitVisible=false">取消</el-button><el-button type="primary" :loading="submitting" @click="doSubmit">提交发布</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getClientReleases, createClientRelease, updateClientRelease, submitClientRelease, rolloutClientRelease, pauseClientRelease, resumeClientRelease, withdrawClientRelease, archiveClientRelease, uploadReleaseArtifact } from '@/api/clientRelease'

const platform = ref('android')
const channel = ref('stable')
const items = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const createVisible = ref(false)
const draftVisible = ref(false)
const submitVisible = ref(false)
const saving = ref(false)
const submitting = ref(false)
const uploading = ref(false)

async function doUploadArtifact(file, target) {
  uploading.value = true
  try {
    const res = await uploadReleaseArtifact(file, target === 'create' ? createForm.platform : form.platform)
    const data = res && res.data ? res.data : res
    const f = target === 'create' ? createForm : form
    f.downloadUrl = data.downloadUrl || ''
    f.sha256 = data.sha256 || ''
    f.sizeBytes = data.sizeBytes || null
    ElMessage.success('上传成功，已自动填充下载地址 / SHA-256 / 大小')
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}
function httpUploadCreate(opt) {
  doUploadArtifact(opt.file, 'create').then(() => opt.onSuccess(), () => opt.onError())
}
function httpUploadEdit(opt) {
  doUploadArtifact(opt.file, 'edit').then(() => opt.onSuccess(), () => opt.onError())
}
const editingId = ref(null)
const submitTarget = ref(null)

const createForm = reactive({ mode: 'direct', platform: 'android', channel: 'stable', version: '', buildNumber: 1, releaseNotes: '', packageType: 'google-play', storeUrl: '', downloadUrl: '', sha256: '', sizeBytes: null, scheduledAt: null, grayPercent: 100 })
const form = reactive({ platform: 'android', channel: 'stable', version: '', buildNumber: 1, releaseNotes: '', storeUrl: '', packageType: 'google-play', downloadUrl: '', sha256: '', sizeBytes: null })
const submitForm = reactive({ percent: 100, scheduledAt: null, reason: '发布审核通过' })

function pad(n) {
  return String(n).padStart(2, '0')
}
// 后端统一用 UTC（无时区后缀）存储/返回；展示时转本地时间。
function fmt(dt) {
  if (!dt) return '-'
  const s = String(dt)
  const d = new Date(s.includes('Z') || s.includes('+') ? s : s + 'Z')
  if (isNaN(d.getTime())) return s.replace('T', ' ')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
// 日期选择器给的是本地时间串，转成 UTC 再提交，保证定时点与服务端 UTC 对齐。
function toUtc(localStr) {
  if (!localStr) return null
  const d = new Date(localStr)
  if (isNaN(d.getTime())) return localStr
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
function disablePast(date) {
  return date.getTime() < Date.now() - 60 * 1000
}
function isStore(pkg) {
  return ['google-play', 'app-store'].includes(pkg)
}
function defaultPackageType(p) {
  if (p === 'ios') return 'app-store'
  if (p === 'windows') return 'exe'
  if (p === 'macos') return 'dmg'
  return 'google-play'
}
function statusText(s) {
  return ({ draft: '草稿', scheduled: '定时发布', rolling_out: '灰度中', released: '已发布', paused: '已暂停', withdrawn: '已撤回', archived: '已归档' })[s] || s
}
function statusType(s) {
  return ({ draft: 'info', scheduled: 'warning', rolling_out: 'primary', released: 'success', paused: 'warning', withdrawn: 'danger', archived: 'info' })[s] || 'info'
}
async function load() {
  loading.value = true
  try {
    const result = await getClientReleases({ platform: platform.value, channel: channel.value, page: page.value, pageSize: pageSize.value })
    items.value = result.items || []
    total.value = result.total ?? 0
  } finally {
    loading.value = false
  }
}
function handlePageSizeChange() {
  page.value = 1
  load()
}
function openCreate() {
  Object.assign(createForm, { mode: 'direct', platform: platform.value, channel: channel.value, version: '', buildNumber: 1, releaseNotes: '', packageType: defaultPackageType(platform.value), storeUrl: '', downloadUrl: '', sha256: '', sizeBytes: null, scheduledAt: null, grayPercent: 100 })
  createVisible.value = true
}
// 校验制品字段；返回 { valid, artifact }。
function buildArtifact(f) {
  const store = isStore(f.packageType)
  if (store) {
    if (!(f.storeUrl || '').trim()) {
      ElMessage.warning('请填写商店地址')
      return null
    }
    return { store, artifact: { architecture: 'universal', packageType: f.packageType } }
  }
  if (!(f.downloadUrl || '').trim() || !/^[0-9a-f]{64}$/.test(f.sha256 || '') || !f.sizeBytes || f.sizeBytes <= 0) {
    ElMessage.warning('请填写 HTTPS 下载地址、64 位小写 SHA-256 和文件大小')
    return null
  }
  return { store, artifact: { architecture: 'universal', packageType: f.packageType, downloadUrl: f.downloadUrl.trim(), sha256: f.sha256.trim(), sizeBytes: f.sizeBytes } }
}
async function createSubmit() {
  if (!/^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/.test(createForm.version) || !createForm.releaseNotes.trim()) {
    ElMessage.warning('请填写 SemVer 版本和更新说明')
    return
  }
  if (createForm.mode === 'pre' && !createForm.scheduledAt) {
    ElMessage.warning('预发布请选择定时上线时间')
    return
  }
  const built = buildArtifact(createForm)
  if (!built) return
  const direct = createForm.mode === 'direct'
  saving.value = true
  try {
    const payload = {
      platform: createForm.platform,
      channel: createForm.channel,
      version: createForm.version,
      buildNumber: createForm.buildNumber,
      releaseNotes: createForm.releaseNotes,
      storeUrl: built.store ? createForm.storeUrl.trim() : null,
      mandatory: false,
      reason: direct ? '直接发布' : '创建预发布',
      compatibility: { protocolVersion: 'v1', minimumServerCapabilityVersion: 1 },
      artifacts: [built.artifact],
    }
    const res = await createClientRelease(payload)
    const release = res && res.data ? res.data : res
    await submitClientRelease(release.id, {
      expectedRowVersion: release.rowVersion ?? 0,
      reason: direct ? '直接发布' : '预发布定时上线',
      initialRolloutPercent: direct ? 100 : createForm.grayPercent,
      scheduledAt: direct ? null : toUtc(createForm.scheduledAt),
    })
    createVisible.value = false
    await load()
    ElMessage.success(direct ? '已直接发布' : '已创建预发布，到点自动上线')
  } finally {
    saving.value = false
  }
}
function openEdit(row) {
  editingId.value = row.id
  const art = (row.artifacts && row.artifacts[0]) || {}
  const pkg = art.packageType || defaultPackageType(row.platform)
  Object.assign(form, { platform: row.platform, channel: row.channel, version: row.version, buildNumber: row.buildNumber, releaseNotes: row.releaseNotes || '', storeUrl: row.storeUrl || '', packageType: pkg, downloadUrl: art.downloadUrl || '', sha256: art.sha256 || '', sizeBytes: art.sizeBytes ?? null })
  draftVisible.value = true
}
async function saveDraft() {
  if (!/^\d+\.\d+\.\d+([+-][0-9A-Za-z.-]+)?$/.test(form.version) || !form.releaseNotes.trim()) {
    ElMessage.warning('请填写 SemVer 版本和更新说明')
    return
  }
  const built = buildArtifact(form)
  if (!built) return
  saving.value = true
  try {
    const row = items.value.find((r) => r.id === editingId.value)
    const payload = {
      platform: form.platform,
      channel: form.channel,
      version: form.version,
      buildNumber: form.buildNumber,
      releaseNotes: form.releaseNotes,
      storeUrl: built.store ? form.storeUrl.trim() : null,
      mandatory: false,
      reason: '更新发布草稿',
      compatibility: { protocolVersion: 'v1', minimumServerCapabilityVersion: 1 },
      artifacts: [built.artifact],
    }
    await updateClientRelease(editingId.value, { ...payload, expectedRowVersion: row ? row.rowVersion : 0 })
    draftVisible.value = false
    editingId.value = null
    await load()
    ElMessage.success('草稿已更新')
  } finally {
    saving.value = false
  }
}
function openSubmit(row) {
  submitTarget.value = row
  Object.assign(submitForm, { percent: 100, scheduledAt: null, reason: '发布审核通过' })
  submitVisible.value = true
}
async function doSubmit() {
  if (!submitForm.reason.trim()) {
    ElMessage.warning('请填写变更原因')
    return
  }
  const row = submitTarget.value
  submitting.value = true
  try {
    await submitClientRelease(row.id, {
      expectedRowVersion: row.rowVersion,
      reason: submitForm.reason.trim(),
      initialRolloutPercent: submitForm.percent,
      scheduledAt: toUtc(submitForm.scheduledAt),
    })
    submitVisible.value = false
    await load()
    ElMessage.success(submitForm.scheduledAt ? '已安排定时发布' : '已发布')
  } finally {
    submitting.value = false
  }
}
async function rollout(row) {
  const value = Math.min(100, Number(row.rolloutPercent || 0) + 10)
  await rolloutClientRelease(row.id, { expectedRowVersion: row.rowVersion, reason: '扩大灰度', rolloutPercent: value })
  await load()
}
async function state(row, action) {
  const result = await ElMessageBox.prompt('请输入变更原因', action === 'withdraw' ? '撤回发布' : action === 'archive' ? '归档发布' : '变更发布状态', { inputPattern: /\S+/, inputErrorMessage: '变更原因不能为空' })
  const api = action === 'pause' ? pauseClientRelease : action === 'resume' ? resumeClientRelease : action === 'archive' ? archiveClientRelease : withdrawClientRelease
  await api(row.id, { expectedRowVersion: row.rowVersion, reason: result.value.trim() })
  await load()
}
onMounted(load)
</script>
