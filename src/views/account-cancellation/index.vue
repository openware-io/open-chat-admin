<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>账号注销管理</h2>
    </div>

    <el-tabs v-model="activeTab" class="admin-card">
      <el-tab-pane label="注销申请" name="applications">
        <div class="filter-bar">
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 140px" @change="reloadApps">
            <el-option label="待注销" value="PENDING" />
            <el-option label="注销中" value="PROCESSING" />
            <el-option label="已注销" value="COMPLETED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
          <el-input v-model="filterKeyword" placeholder="用户名/昵称" clearable style="width: 220px"
            @keyup.enter="reloadApps" @clear="reloadApps" />
          <el-button type="primary" @click="reloadApps">查询</el-button>
        </div>

        <el-table :data="apps" v-loading="appsLoading" stripe border>
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="id" label="申请ID" width="80" />
          <el-table-column prop="userId" label="用户ID" width="90" />
          <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType[row.status]" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="80" align="center">
            <template #default="{ row }">{{ sourceMap[row.source] || row.source }}</template>
          </el-table-column>
          <el-table-column label="删除步骤" min-width="240">
            <template #default="{ row }">
              <el-tag v-for="step in row.completedSteps || []" :key="step" size="small" type="success"
                style="margin: 1px 2px">{{ stepMap[step] || step }}</el-tag>
              <span v-if="!row.completedSteps || row.completedSteps.length === 0" style="color: #909399">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="requestedAt" label="申请时间" width="170" />
          <el-table-column prop="completedAt" label="完成时间" width="170" />
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showLogs(row)">审计日志</el-button>
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
          @size-change="loadApps"
          @current-change="loadApps"
        />
      </el-tab-pane>

      <el-tab-pane label="审计日志" name="logs">
        <div class="filter-bar">
          <el-input v-model="logUserId" placeholder="用户ID" clearable style="width: 160px"
            @keyup.enter="reloadLogs" @clear="reloadLogs" />
          <el-select v-model="logAction" placeholder="动作" clearable style="width: 160px" @change="reloadLogs">
            <el-option label="已申请" value="REQUESTED" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
          <el-button type="primary" @click="reloadLogs">查询</el-button>
        </div>

        <el-table :data="logs" v-loading="logsLoading" stripe border>
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">{{ (logPage - 1) * logPageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="cancellationId" label="申请ID" width="90" />
          <el-table-column prop="userId" label="用户ID" width="90" />
          <el-table-column label="动作" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType[row.action]" size="small">{{ statusMap[row.action] || row.action }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="detail" label="详情" min-width="240" show-overflow-tooltip />
          <el-table-column prop="operatorType" label="操作方" width="90" align="center" />
          <el-table-column prop="ip" label="IP" width="140" />
          <el-table-column prop="occurredAt" label="时间" width="170" />
        </el-table>

        <el-pagination
          v-model:current-page="logPage"
          v-model:page-size="logPageSize"
          :total="logTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          class="admin-pagination"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="logsDialogVisible" title="审计日志" width="760px">
      <el-table :data="dialogLogs" v-loading="dialogLoading" stripe border max-height="420">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="动作" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType[row.action]" size="small">{{ statusMap[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
        <el-table-column prop="operatorType" label="操作方" width="90" align="center" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="occurredAt" label="时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAccountCancellations, getAccountCancellationLogs, searchAccountCancellationLogs } from '@/api/accountCancellation'

const statusMap = { PENDING: '待注销', PROCESSING: '注销中', COMPLETED: '已注销', FAILED: '失败', REQUESTED: '已申请' }
const statusType = { PENDING: 'info', PROCESSING: 'warning', COMPLETED: 'success', FAILED: 'danger', REQUESTED: 'info' }
const sourceMap = { web: '官网', app: 'App', admin: '后台' }
const stepMap = {
  account: '账号及缓存',
  chat_records: '聊天记录及缓存',
  device_tokens: '登录设备与推送',
  friends: '好友关系',
  profile_settings: '个人资料与设置',
  client_data: '各端App数据与缓存',
}

const activeTab = ref('applications')

const apps = ref([])
const appsLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filterStatus = ref('')
const filterKeyword = ref('')

const logs = ref([])
const logsLoading = ref(false)
const logTotal = ref(0)
const logPage = ref(1)
const logPageSize = ref(20)
const logUserId = ref('')
const logAction = ref('')

const logsDialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogLogs = ref([])

async function loadApps() {
  appsLoading.value = true
  try {
    const res = await getAccountCancellations({
      page: page.value,
      pageSize: pageSize.value,
      status: filterStatus.value || undefined,
      keyword: filterKeyword.value || undefined,
    })
    apps.value = res.items
    total.value = res.total
  } finally {
    appsLoading.value = false
  }
}

function reloadApps() {
  page.value = 1
  loadApps()
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const res = await searchAccountCancellationLogs({
      page: logPage.value,
      pageSize: logPageSize.value,
      userId: logUserId.value || undefined,
      action: logAction.value || undefined,
    })
    logs.value = res.items
    logTotal.value = res.total
  } finally {
    logsLoading.value = false
  }
}

function reloadLogs() {
  logPage.value = 1
  loadLogs()
}

async function showLogs(row) {
  logsDialogVisible.value = true
  dialogLoading.value = true
  dialogLogs.value = []
  try {
    dialogLogs.value = await getAccountCancellationLogs(row.id)
  } finally {
    dialogLoading.value = false
  }
}

onMounted(() => {
  loadApps()
  loadLogs()
})
</script>
