<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>消息管理</h2>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索消息内容" clearable
        style="width: 220px" @clear="loadData" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.chatType" placeholder="会话类型" clearable style="width: 130px" @change="loadData">
        <el-option label="私聊" value="private" />
        <el-option label="群聊" value="group" />
      </el-select>
      <el-select v-model="filters.msgType" placeholder="消息类型" clearable style="width: 130px" @change="loadData">
        <el-option label="文本" value="text" />
        <el-option label="图片" value="image" />
        <el-option label="文件" value="file" />
        <el-option label="语音" value="voice" />
        <el-option label="视频" value="video" />
        <el-option label="位置" value="location" />
      </el-select>
      <el-select v-model="filters.status" placeholder="消息状态" clearable style="width: 130px" @change="loadData">
        <el-option label="已发送" value="sent" />
        <el-option label="已送达" value="delivered" />
        <el-option label="已读" value="read" />
        <el-option label="已撤回" value="recalled" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Search /></el-icon> 查询
      </el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
      <el-table-column label="序号" width="64" align="center"><template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template></el-table-column><el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="发送者" width="130">
        <template #default="{ row }">
          {{ row.fromUser?.nickname || row.fromUser?.username || row.from_user_id }}
        </template>
      </el-table-column>
      <el-table-column prop="to_id" label="接收方ID" width="100" />
      <el-table-column label="会话类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.chat_type === 'private' ? '' : 'success'" size="small">
            {{ row.chat_type === 'private' ? '私聊' : '群聊' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="消息类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag type="info" size="small">{{ msgTypeMap[row.msg_type] || row.msg_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="消息内容" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.status]" size="small">
            {{ statusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发送时间" width="180" sortable>
        <template #default="{ row }">
          {{ formatMessageTime(row.createdAt ?? row.created_at) }}
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
      @size-change="loadData"
      @current-change="loadData"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMessages } from '@/api/message'

const msgTypeMap = { text: '文本', image: '图片', file: '文件', voice: '语音', video: '视频', location: '位置', system: '系统', recall: '撤回' }
const statusMap = { sent: '已发送', delivered: '已送达', read: '已读', recalled: '已撤回' }
const statusTypeMap = { sent: 'info', delivered: '', read: 'success', recalled: 'warning' }

function formatMessageTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date)
}

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', chatType: '', msgType: '', status: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await getMessages({ ...filters, page: page.value, pageSize: pageSize.value })
    tableData.value = res.items || []
    total.value = res.total || 0
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
