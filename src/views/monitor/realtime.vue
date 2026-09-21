<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>实时状态监控</h2>
      <div>
        <el-tag type="success" effect="dark" style="margin-right: 8px">
          <el-icon><Connection /></el-icon> 在线: {{ onlineCount }}
        </el-tag>
        <el-button type="primary" :icon="Refresh" @click="refreshAll" :loading="loading">刷新</el-button>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="icon-wrapper" style="background: #409eff">
          <el-icon><User /></el-icon>
        </div>
        <div class="info">
          <div class="label">当前在线人数</div>
          <div class="value">{{ onlineCount }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon-wrapper" style="background: #e6a23c">
          <el-icon><Phone /></el-icon>
        </div>
        <div class="info">
          <div class="label">通话中房间</div>
          <div class="value">{{ callRooms.length }}</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="chart-container">
          <h3>实时在线用户列表</h3>
          <el-table :data="onlineUsers" stripe border size="small" max-height="360">
            <el-table-column label="头像" width="60">
              <template #default="{ row }">
                <el-avatar :size="28" :src="row.avatar" />
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="nickname" label="昵称" width="120" />
            <el-table-column label="连接数" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.socketCount }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="chart-container">
          <h3>通话房间</h3>
          <el-empty v-if="!callRooms.length" description="当前没有进行中的通话" />
          <el-table v-else :data="callRooms" stripe border size="small">
            <el-table-column prop="callId" label="通话 ID" min-width="200" show-overflow-tooltip />
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.mediaType === 'video' ? 'danger' : 'warning'" size="small">
                  {{ row.mediaType === 'video' ? '视频' : '语音' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发起方" width="100">
              <template #default="{ row }">
                用户 {{ row.callerId }}
              </template>
            </el-table-column>
            <el-table-column label="接收方" width="100">
              <template #default="{ row }">
                用户 {{ row.calleeId }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ringing' ? 'warning' : 'success'" size="small">
                  {{ row.status === 'ringing' ? '振铃中' : '通话中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleEndCall(row)">强制结束</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOnlineUsers, getOnlineCount, getCallRooms, endCall } from '@/api/monitor'

const loading = ref(false)
const onlineCount = ref(0)
const onlineUsers = ref([])
const callRooms = ref([])
let timer = null

async function refreshAll() {
  loading.value = true
  try {
    const [countRes, users, rooms] = await Promise.all([
      getOnlineCount(),
      getOnlineUsers(),
      getCallRooms(),
    ])
    onlineCount.value = countRes.onlineCount
    onlineUsers.value = users
    callRooms.value = rooms
  } catch (err) {
    console.error('Refresh failed:', err)
  } finally {
    loading.value = false
  }
}

async function handleEndCall(room) {
  await ElMessageBox.confirm('确定要强制结束该通话吗？', '提示', { type: 'warning' })
  await endCall(room.callId)
  ElMessage.success('已结束通话')
  callRooms.value = callRooms.value.filter(r => r.callId !== room.callId)
}

onMounted(() => {
  refreshAll()
  timer = setInterval(refreshAll, 15000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>
