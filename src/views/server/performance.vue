<template>
  <div class="admin-page">
    <div class="stats-row grid-4" style="margin-bottom: 20px">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #79bbff)">
          <el-icon><Cpu /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ metrics.current.cpu }}%</div>
          <div class="stat-label">CPU 占用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c, #eebe77)">
          <el-icon><Coin /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ metrics.current.memory }}%</div>
          <div class="stat-label">内存占用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #95d475)">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ metrics.current.wsConns }}</div>
          <div class="stat-label">WebSocket 连接</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #f89898)">
          <el-icon><Odometer /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ metrics.current.qps }}</div>
          <div class="stat-label">当前 QPS</div>
        </div>
      </div>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="12">
        <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 4px">
          <span style="font-size: 13px; color: #909399">消息成功率</span>
          <div style="display: flex; align-items: baseline; gap: 6px">
            <span style="font-size: 28px; font-weight: 700; color: #67c23a">{{ metrics.current.msgSuccessRate }}%</span>
            <span style="font-size: 13px; color: #909399">延迟 {{ metrics.current.msgDelay }}ms</span>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 4px">
          <span style="font-size: 13px; color: #909399">网络流量</span>
          <div style="display: flex; align-items: baseline; gap: 12px">
            <span style="font-size: 14px">入: <b style="color: #409eff">{{ metrics.current.inTraffic }} MB/s</b></span>
            <span style="font-size: 14px">出: <b style="color: #e6a23c">{{ metrics.current.outTraffic }} MB/s</b></span>
            <span style="font-size: 14px">带宽: <b>{{ metrics.current.bandwidth }} Mbps</b></span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="12">
        <div class="page-card">
          <div class="page-header"><span class="page-title">CPU / 内存趋势</span></div>
          <div ref="cpuChartRef" class="chart-container-sm"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <div class="page-header"><span class="page-title">QPS / 连接数趋势</span></div>
          <div ref="qpsChartRef" class="chart-container-sm"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="12">
        <div class="page-card">
          <div class="page-header"><span class="page-title">网络流量趋势</span></div>
          <div ref="trafficChartRef" class="chart-container-sm"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <div class="page-header"><span class="page-title">消息延迟 / 成功率</span></div>
          <div ref="msgChartRef" class="chart-container-sm"></div>
        </div>
      </el-col>
    </el-row>

    <div class="page-card">
      <div class="page-header">
        <span class="page-title">服务器节点状态</span>
      </div>
      <el-table :data="metrics.nodes" stripe>
        <el-table-column label="节点名称" prop="name" width="120" />
        <el-table-column label="IP 地址" prop="ip" width="140" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span>
              <span class="status-dot" :class="row.status"></span>
              {{ row.status === 'normal' ? '正常' : '异常' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="CPU" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.cpu" :color="progressColor(row.cpu)" :stroke-width="14" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="内存" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.memory" :color="progressColor(row.memory)" :stroke-width="14" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="连接数" prop="connections" width="100" align="center" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { mockServerMetrics } from '@/utils/mock'

const cpuChartRef = ref()
const qpsChartRef = ref()
const trafficChartRef = ref()
const msgChartRef = ref()
let charts = []

const metrics = ref({
  current: { cpu: 0, memory: 0, qps: 0, wsConns: 0, bandwidth: 0, inTraffic: 0, outTraffic: 0, msgSuccessRate: 0, msgDelay: 0, uptime: 0 },
  history: [],
  nodes: [],
})

function progressColor(val) {
  if (val > 80) return '#f56c6c'
  if (val > 60) return '#e6a23c'
  return '#67c23a'
}

function initCharts() {
  const data = mockServerMetrics()
  metrics.value = data
  const times = data.history.map(h => h.time)

  const cpuChart = echarts.init(cpuChartRef.value)
  charts.push(cpuChart)
  cpuChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU', '内存'], top: 0 },
    grid: { left: 45, right: 15, top: 30, bottom: 25 },
    xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: 'CPU', type: 'line', smooth: true, data: data.history.map(h => h.cpu), itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.1 } },
      { name: '内存', type: 'line', smooth: true, data: data.history.map(h => h.memory), itemStyle: { color: '#e6a23c' }, areaStyle: { opacity: 0.1 } },
    ],
  })

  const qpsChart = echarts.init(qpsChartRef.value)
  charts.push(qpsChart)
  qpsChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['QPS', 'WS连接'], top: 0 },
    grid: { left: 45, right: 45, top: 30, bottom: 25 },
    xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
    yAxis: [{ type: 'value', name: 'QPS' }, { type: 'value', name: '连接' }],
    series: [
      { name: 'QPS', type: 'bar', data: data.history.map(h => h.qps), itemStyle: { color: '#f56c6c', borderRadius: [3, 3, 0, 0] }, barWidth: '50%' },
      { name: 'WS连接', type: 'line', yAxisIndex: 1, smooth: true, data: data.history.map(h => h.wsConns), itemStyle: { color: '#67c23a' } },
    ],
  })

  const trafficChart = echarts.init(trafficChartRef.value)
  charts.push(trafficChart)
  trafficChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['入网流量', '出网流量'], top: 0 },
    grid: { left: 50, right: 15, top: 30, bottom: 25 },
    xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value} MB/s' } },
    series: [
      { name: '入网流量', type: 'line', smooth: true, data: data.history.map(h => h.inTraffic), itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.15 } },
      { name: '出网流量', type: 'line', smooth: true, data: data.history.map(h => h.outTraffic), itemStyle: { color: '#e6a23c' }, areaStyle: { opacity: 0.15 } },
    ],
  })

  const msgChart = echarts.init(msgChartRef.value)
  charts.push(msgChart)
  msgChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功率', '延迟'], top: 0 },
    grid: { left: 50, right: 45, top: 30, bottom: 25 },
    xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
    yAxis: [
      { type: 'value', min: 90, max: 100, axisLabel: { formatter: '{value}%' } },
      { type: 'value', axisLabel: { formatter: '{value}ms' } },
    ],
    series: [
      { name: '成功率', type: 'line', smooth: true, data: data.history.map(h => parseFloat(h.msgSuccessRate)), itemStyle: { color: '#67c23a' } },
      { name: '延迟', type: 'bar', yAxisIndex: 1, data: data.history.map(h => h.msgDelay), itemStyle: { color: '#f56c6c', borderRadius: [3, 3, 0, 0] }, barWidth: '40%' },
    ],
  })
}

function handleResize() { charts.forEach(c => c.resize()) }

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>
