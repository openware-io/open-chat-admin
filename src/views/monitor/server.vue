<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>服务器与运维监控</h2>
      <el-button type="primary" :icon="Refresh" @click="refreshData" :loading="loading">刷新</el-button>
    </div>

    <div class="stat-cards">
      <div class="stat-card" v-for="item in metricCards" :key="item.label">
        <div class="icon-wrapper" :style="{ background: item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="info">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
          <div class="trend" v-if="item.sub" style="font-size: 12px; color: #909399">{{ item.sub }}</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="chart-container">
          <h3>CPU 占用</h3>
          <div ref="cpuChartRef" style="height: 200px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-container">
          <h3>内存占用</h3>
          <div ref="memChartRef" style="height: 200px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-container">
          <h3>系统信息</h3>
          <el-descriptions :column="1" border size="small" style="margin-top: 10px">
            <el-descriptions-item label="主机名">{{ stats.hostname }}</el-descriptions-item>
            <el-descriptions-item label="平台">{{ stats.platform }} / {{ stats.arch }}</el-descriptions-item>
            <el-descriptions-item label="Node 版本">{{ stats.nodeVersion }}</el-descriptions-item>
            <el-descriptions-item label="运行时间">{{ formatUptime(stats.uptime) }}</el-descriptions-item>
            <el-descriptions-item label="总内存">{{ stats.totalMemory }} MB</el-descriptions-item>
            <el-descriptions-item label="可用内存">{{ stats.freeMemory }} MB</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="chart-container">
          <h3>CPU 历史</h3>
          <div ref="cpuHistoryRef" style="height: 280px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <h3>内存历史</h3>
          <div ref="memHistoryRef" style="height: 280px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, markRaw } from 'vue'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import { Cpu, Connection, Timer, CircleCheck } from '@element-plus/icons-vue'
import { getServerStats } from '@/api/monitor'

const loading = ref(false)
const stats = ref({})

const cpuChartRef = ref()
const memChartRef = ref()
const cpuHistoryRef = ref()
const memHistoryRef = ref()
let charts = []
let timer = null
const cpuHistory = ref([])
const memHistory = ref([])

const metricCards = computed(() => {
  const s = stats.value
  return [
    { label: 'CPU 占用', value: `${s.cpu || 0}%`, icon: markRaw(Cpu), color: '#409eff' },
    { label: '内存占用', value: `${s.memory || 0}%`, icon: markRaw(Timer), color: '#e6a23c', sub: `${s.freeMemory || 0} MB 可用` },
    { label: 'WebSocket 连接', value: String(s.wsConnections || 0), icon: markRaw(Connection), color: '#67c23a' },
    { label: '运行时间', value: formatUptime(s.uptime), icon: markRaw(CircleCheck), color: '#9b59b6' },
  ]
})

function formatUptime(seconds) {
  if (!seconds) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}小时`
  if (h > 0) return `${h}小时 ${m}分钟`
  return `${m}分钟`
}

function makeGauge(el, value, color) {
  const chart = echarts.init(el)
  chart.setOption({
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      progress: { show: true, width: 14, itemStyle: { color } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#e6e8eb']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: false },
      detail: { fontSize: 28, fontWeight: 700, color, offsetCenter: [0, '10%'], formatter: '{value}%' },
      data: [{ value }],
    }],
  })
  return chart
}

async function refreshData() {
  loading.value = true
  try {
    stats.value = await getServerStats()
    updateCharts()
  } catch (err) {
    console.error('Server stats failed:', err)
  } finally {
    loading.value = false
  }
}

function updateCharts() {
  const s = stats.value
  charts.forEach(c => c.dispose())
  charts = []

  charts.push(makeGauge(cpuChartRef.value, s.cpu, s.cpu > 70 ? '#f56c6c' : '#409eff'))
  charts.push(makeGauge(memChartRef.value, s.memory, s.memory > 80 ? '#f56c6c' : '#e6a23c'))

  const now = new Date()
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  cpuHistory.value.push({ time: timeLabel, value: s.cpu })
  memHistory.value.push({ time: timeLabel, value: s.memory })
  if (cpuHistory.value.length > 30) cpuHistory.value.shift()
  if (memHistory.value.length > 30) memHistory.value.shift()

  const cpuHChart = echarts.init(cpuHistoryRef.value)
  cpuHChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, bottom: 30, top: 20 },
    xAxis: { type: 'category', data: cpuHistory.value.map(c => c.time) },
    yAxis: { type: 'value', max: 100, name: '%' },
    series: [{ type: 'line', data: cpuHistory.value.map(c => c.value), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#409eff' } }],
  })
  charts.push(cpuHChart)

  const memHChart = echarts.init(memHistoryRef.value)
  memHChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, bottom: 30, top: 20 },
    xAxis: { type: 'category', data: memHistory.value.map(m => m.time) },
    yAxis: { type: 'value', max: 100, name: '%' },
    series: [{ type: 'line', data: memHistory.value.map(m => m.value), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#e6a23c' } }],
  })
  charts.push(memHChart)
}

onMounted(() => {
  refreshData()
  timer = setInterval(refreshData, 10000)
})

onUnmounted(() => {
  clearInterval(timer)
  charts.forEach(c => c.dispose())
})
</script>
