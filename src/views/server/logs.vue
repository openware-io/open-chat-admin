<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">日志查看</span>
    </div>

    <div class="filter-bar">
      <el-select v-model="query.level" placeholder="日志级别" clearable style="width: 130px" @change="search">
        <el-option label="INFO" value="INFO" />
        <el-option label="WARN" value="WARN" />
        <el-option label="ERROR" value="ERROR" />
        <el-option label="DEBUG" value="DEBUG" />
      </el-select>
      <el-select v-model="query.module" placeholder="模块" clearable style="width: 150px" @change="search">
        <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="搜索日志内容" clearable style="width: 240px" @keyup.enter="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="search">查询</el-button>
      <el-switch v-model="autoRefresh" active-text="自动刷新" inactive-text="" style="margin-left: auto" @change="toggleAutoRefresh" />
    </div>

    <el-table :data="logList" v-loading="loading" stripe :row-class-name="logRowClass" style="font-family: 'Consolas', 'Monaco', monospace; font-size: 13px">
      <el-table-column label="时间" width="175">
        <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column label="级别" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="levelType[row.level]" size="small" effect="dark">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模块" prop="module" width="140" />
      <el-table-column label="内容" prop="message" min-width="400" show-overflow-tooltip />
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { formatTime } from '@/utils/format'
import { mockLogs } from '@/utils/mock'

const modules = ['Gateway', 'AuthService', 'MessageService', 'UserService', 'RTCService', 'Redis', 'MySQL']
const levelType = { INFO: 'info', WARN: 'warning', ERROR: 'danger', DEBUG: '' }

const loading = ref(false)
const logList = ref([])
const total = ref(0)
const autoRefresh = ref(false)
const query = reactive({ level: '', module: '', keyword: '', page: 1, pageSize: 50 })
let timer = null

function logRowClass({ row }) {
  if (row.level === 'ERROR') return 'log-error-row'
  if (row.level === 'WARN') return 'log-warn-row'
  return ''
}

function search() { query.page = 1; loadData() }

function loadData() {
  loading.value = true
  setTimeout(() => {
    const res = mockLogs(query.page, query.pageSize)
    let list = res.list
    if (query.level) list = list.filter(l => l.level === query.level)
    if (query.module) list = list.filter(l => l.module === query.module)
    if (query.keyword) list = list.filter(l => l.message.includes(query.keyword))
    logList.value = list
    total.value = res.total
    loading.value = false
  }, 300)
}

function toggleAutoRefresh(val) {
  if (val) {
    timer = setInterval(loadData, 5000)
  } else {
    clearInterval(timer)
  }
}

onMounted(() => loadData())

onUnmounted(() => clearInterval(timer))
</script>

<style>
.log-error-row td { background-color: #fef0f0 !important; }
.log-warn-row td { background-color: #fdf6ec !important; }
</style>
