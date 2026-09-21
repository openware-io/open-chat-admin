<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">通话监控</span>
      <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
    </div>

    <el-alert v-if="rooms.length === 0 && !loading" title="当前没有正在进行的通话" type="info" :closable="false" show-icon style="margin-bottom: 16px" />

    <el-row :gutter="16">
      <el-col :span="12" v-for="room in rooms" :key="room.roomId" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon :size="18" :style="{ color: room.type === 'video' ? '#409eff' : '#67c23a' }">
                  <VideoCamera v-if="room.type === 'video'" />
                  <Microphone v-else />
                </el-icon>
                <span style="font-weight: 600">{{ room.roomId }}</span>
                <el-tag size="small" :type="room.type === 'video' ? '' : 'success'">
                  {{ room.type === 'video' ? '视频通话' : '语音通话' }}
                </el-tag>
              </div>
              <el-button type="danger" size="small" @click="handleEndCall(room)">强制结束</el-button>
            </div>
          </template>

          <div class="call-detail">
            <div class="call-meta">
              <div class="meta-item">
                <span class="meta-label">通话时长</span>
                <span class="meta-value">{{ formatDuration(room.duration) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">通话质量</span>
                <span>
                  <span class="status-dot" :class="room.quality"></span>
                  {{ qualityMap[room.quality] }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">开始时间</span>
                <span class="meta-value">{{ formatTime(room.startedAt) }}</span>
              </div>
            </div>

            <el-divider content-position="left">参与人员 ({{ room.participants.length }})</el-divider>
            <div style="display: flex; flex-wrap: wrap; gap: 8px">
              <div v-for="p in room.participants" :key="p.userId" class="participant-item">
                <span>{{ p.nickname }}</span>
                <el-button type="danger" link size="small" @click="handleKick(room, p)">踢出</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div style="text-align: center; padding: 16px; color: #909399; font-size: 13px">
      共 {{ rooms.length }} 个通话房间 · 每 5 秒自动刷新
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { formatTime, formatDuration } from '@/utils/format'
import { mockCallRooms } from '@/utils/mock'

const qualityMap = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
const loading = ref(false)
const rooms = ref([])
let timer = null

function loadData() {
  loading.value = true
  setTimeout(() => {
    rooms.value = mockCallRooms()
    loading.value = false
  }, 300)
}

async function handleEndCall(room) {
  await ElMessageBox.confirm(`确定要强制结束房间 ${room.roomId} 的通话吗？`, '操作确认', { type: 'warning' })
  rooms.value = rooms.value.filter(r => r.roomId !== room.roomId)
  ElMessage.success('已强制结束通话')
}

async function handleKick(room, participant) {
  await ElMessageBox.confirm(`确定要将 ${participant.nickname} 踢出通话吗？`, '操作确认', { type: 'warning' })
  room.participants = room.participants.filter(p => p.userId !== participant.userId)
  if (room.participants.length < 2) {
    rooms.value = rooms.value.filter(r => r.roomId !== room.roomId)
  }
  ElMessage.success('操作成功')
}

onMounted(() => {
  loadData()
  timer = setInterval(loadData, 5000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.call-detail .call-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 12px;
  color: #909399;
}
.meta-value {
  font-size: 14px;
  font-weight: 500;
}
.participant-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f4f4f5;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
}
</style>
