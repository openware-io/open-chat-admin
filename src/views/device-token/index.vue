<template>
  <div class="admin-page device-token-manage">
    <div class="page-header">
      <h2>设备推送令牌</h2>
    </div>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>设备推送令牌（APNs / FCM / 极光，按 pushProvider）</span>
          <el-form :inline="true" @submit.prevent="handleSearch" style="margin:0">
            <el-form-item style="margin-bottom:0">
              <el-input
                v-model="filterUserId"
                placeholder="按用户 ID 筛选"
                clearable
                style="width:180px"
                @clear="handleSearch"
              />
            </el-form-item>
            <el-form-item style="margin-bottom:0">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe border style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="userId" label="用户 ID" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="pushProvider" label="推送渠道" width="110" />
        <el-table-column prop="deviceId" label="设备 ID" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.deviceId || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="令牌（脱敏）" min-width="200">
          <template #default="{ row }">
              <el-tooltip :content="row.tokenFingerprint" placement="top" :show-after="400">
                <span class="token-mask">{{ maskToken(row.tokenFingerprint) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="启用" width="72">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确定删除该设备令牌？删除后该设备需重新登录才能恢复离线推送。"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getDeviceTokens, deleteDeviceToken } from '@/api/deviceToken'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filterUserId = ref('')

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

function maskToken(token) {
  if (!token || token.length < 24) return token || '-'
  return `${token.slice(0, 12)}…${token.slice(-8)}`
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filterUserId.value) params.userId = filterUserId.value
    const res = await getDeviceTokens(params)
    list.value = res.items || []
    total.value = res.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

async function handleDelete(id) {
  try {
    await deleteDeviceToken(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.token-mask {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #606266;
  cursor: default;
}
</style>
