<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">会话监控</span>
      <div style="display: flex; gap: 8px">
        <el-select v-model="chatTypeFilter" placeholder="会话类型" clearable style="width: 130px" @change="filterSessions">
          <el-option label="单聊" value="private" />
          <el-option label="群聊" value="group" />
        </el-select>
        <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-table :data="filteredSessions" v-loading="loading" stripe>
      <el-table-column label="会话ID" prop="sessionId" width="120" />
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.chatType === 'private' ? '' : 'warning'">
            {{ row.chatType === 'private' ? '单聊' : '群聊' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="参与者" min-width="250">
        <template #default="{ row }">
          <div style="display: flex; flex-wrap: wrap; gap: 4px">
            <el-tag v-for="p in row.participants.slice(0, 5)" :key="p.userId" size="small" type="info">
              {{ p.nickname }}
            </el-tag>
            <el-tag v-if="row.participants.length > 5" size="small" type="info">
              +{{ row.participants.length - 5 }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="消息数" prop="messageCount" width="90" align="center" />
      <el-table-column label="开始时间" width="170">
        <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
      </el-table-column>
      <el-table-column label="最近活跃" width="170">
        <template #default="{ row }">{{ formatTime(row.lastActiveAt) }}</template>
      </el-table-column>
    </el-table>

    <div style="text-align: center; padding: 16px; color: #909399; font-size: 13px">
      共 {{ filteredSessions.length }} 个活跃会话 · 每 10 秒自动刷新
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { mockSessions } from '@/utils/mock'

const loading = ref(false)
const sessions = ref([])
const chatTypeFilter = ref('')
let timer = null

const filteredSessions = computed(() => {
  if (!chatTypeFilter.value) return sessions.value
  return sessions.value.filter(s => s.chatType === chatTypeFilter.value)
})

function filterSessions() {}

function loadData() {
  loading.value = true
  setTimeout(() => {
    sessions.value = mockSessions()
    loading.value = false
  }, 300)
}

onMounted(() => {
  loadData()
  timer = setInterval(loadData, 10000)
})

onUnmounted(() => clearInterval(timer))
</script>
