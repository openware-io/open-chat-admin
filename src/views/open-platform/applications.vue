<template>
  <div class="open-platform">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>第三方接入管理</span>
          <div>
            <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width:130px;margin-right:8px" @change="load">
              <el-option label="自营" value="FIRST_PARTY" />
              <el-option label="第三方" value="THIRD_PARTY" />
            </el-select>
            <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:140px;margin-right:8px" @change="load">
              <el-option label="待审核" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
              <el-option label="已吊销" value="SUSPENDED" />
            </el-select>
            <el-button type="primary" @click="load">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="items" v-loading="loading" border>
        <el-table-column prop="appId" label="appId" width="180" show-overflow-tooltip />
        <el-table-column prop="appName" label="应用名称" width="160" show-overflow-tooltip />
        <el-table-column prop="subjectName" label="主体" width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.appType === 'FIRST_PARTY' ? 'info' : 'primary'" size="small">{{ typeText(row.appType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="callbackUrl" label="回调地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejectReason" label="驳回原因" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'PENDING'" size="small" type="success" @click="approve(row)">通过</el-button>
            <el-button v-if="row.status === 'PENDING'" size="small" type="danger" @click="openReject(row)">驳回</el-button>
            <el-button v-if="row.status === 'APPROVED'" size="small" @click="resetSecret(row)">重置密钥</el-button>
            <el-button v-if="row.status === 'APPROVED'" size="small" type="danger" @click="revoke(row)">吊销</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:12px;justify-content:flex-end" layout="total, prev, pager, next" :total="total" :page-size="pageSize" :current-page="page" @current-change="onPage" />
    </el-card>

    <el-dialog v-model="rejectVisible" title="驳回申请" width="420px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="填写驳回原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="secretVisible" title="应用密钥（仅本次展示，请立即保存）" width="480px">
      <el-alert type="warning" :closable="false" show-icon title="appSecret 仅展示这一次，请立即复制保存" style="margin-bottom:12px" />
      <p>appId：<b>{{ secret.appId }}</b></p>
      <p>appSecret：<el-input v-model="secret.appSecret" readonly /></p>
      <template #footer>
        <el-button type="primary" @click="secretVisible = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApplications, approveApplication, rejectApplication, resetSecret as resetSecretApi, revokeApplication } from '@/api/openPlatform'

const loading = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const typeFilter = ref('')
const statusFilter = ref('')

const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null)
const secretVisible = ref(false)
const secret = ref({ appId: '', appSecret: '' })

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (typeFilter.value) params.appType = typeFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    const data = await getApplications(params)
    items.value = data.items || []
    total.value = data.total || 0
  } catch (e) {
    // 错误已由 request 拦截器统一提示
  } finally {
    loading.value = false
  }
}

function onPage(p) { page.value = p; load() }

function statusText(s) {
  return { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回', SUSPENDED: '已吊销' }[s] || s
}
function statusType(s) {
  return { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', SUSPENDED: 'info' }[s] || 'info'
}
function typeText(s) {
  return { FIRST_PARTY: '自营', THIRD_PARTY: '第三方' }[s] || s
}

async function approve(row) {
  await ElMessageBox.confirm('通过后将为该应用分配 appId/appSecret，确认通过？', '审核通过', { type: 'warning' })
  const data = await approveApplication(row.appId)
  secret.value = { appId: data.appId, appSecret: data.appSecret }
  secretVisible.value = true
  load()
}

function openReject(row) {
  rejectTarget.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}
async function submitReject() {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  await rejectApplication(rejectTarget.value.appId, rejectReason.value.trim())
  ElMessage.success('已驳回')
  rejectVisible.value = false
  load()
}

async function resetSecret(row) {
  await ElMessageBox.confirm('重置后旧密钥立即失效，确认重置？', '重置密钥', { type: 'warning' })
  const data = await resetSecretApi(row.appId)
  secret.value = { appId: data.appId, appSecret: data.appSecret }
  secretVisible.value = true
}

async function revoke(row) {
  await ElMessageBox.confirm('吊销后该应用将无法再授权与换取 token，确认吊销？', '吊销应用', { type: 'warning' })
  await revokeApplication(row.appId)
  ElMessage.success('已吊销')
  load()
}

onMounted(load)
</script>

<style scoped>
.open-platform { padding: 16px; }
</style>
