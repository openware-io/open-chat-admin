<template>
  <div class="admin-page">
    <div class="stats-row grid-4" style="margin-bottom: 20px">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #79bbff)">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.onlineCount }}</div>
          <div class="stat-label">当前在线人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #95d475)">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c, #eebe77)">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.peakToday }}</div>
          <div class="stat-label">今日峰值</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #909399, #b1b3b8)">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.wsConnections }}</div>
          <div class="stat-label">WebSocket 连接</div>
        </div>
      </div>
    </div>

    <div class="page-card">
      <div class="page-header">
        <span class="page-title">实时在线用户列表</span>
        <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
      </div>

      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column label="用户ID" prop="userId" width="100" />
        <el-table-column label="昵称" min-width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="28" :src="row.avatar">{{ row.nickname?.[0] }}</el-avatar>
              <span>{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="设备" prop="device" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="deviceType[row.device] || ''">{{ row.device }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IP 地址" prop="ip" width="150" />
        <el-table-column label="登录时间" width="170">
          <template #default="{ row }">{{ formatTime(row.loginTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default>
            <span><span class="status-dot online"></span>在线</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { mockOnlineStats, mockOnlineUsers } from '@/utils/mock'

const deviceType = { iOS: 'success', Android: 'warning', Web: '', Desktop: 'info' }
const loading = ref(false)
const stats = ref({ onlineCount: 0, totalUsers: 0, peakToday: 0, wsConnections: 0 })
const userList = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })
let timer = null

function loadData() {
  stats.value = mockOnlineStats()
  loadUsers()
}

function loadUsers() {
  loading.value = true
  setTimeout(() => {
    const res = mockOnlineUsers(query.page, query.pageSize)
    userList.value = res.list
    total.value = res.total
    loading.value = false
  }, 300)
}

onMounted(() => {
  loadData()
  timer = setInterval(() => { stats.value = mockOnlineStats() }, 10000)
})

onUnmounted(() => { clearInterval(timer) })
</script>
