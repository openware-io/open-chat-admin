<template>
  <div class="admin-page dashboard">
    <div class="page-header">
      <h2>数据看板</h2>
      <el-tag type="success" effect="plain">
        <el-icon><CircleCheck /></el-icon> 系统运行正常
      </el-tag>
    </div>

    <div class="stat-cards">
      <div class="stat-card" v-for="item in statCards" :key="item.label">
        <div class="icon-wrapper" :style="{ background: item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="info">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
          <div class="trend" :class="item.trendDir">
            {{ item.trend }}
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="chart-container">
          <h3>近30天趋势</h3>
          <div ref="trendChartRef" style="height: 350px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-container">
          <h3>今日分时消息量</h3>
          <div ref="hourlyChartRef" style="height: 350px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import * as echarts from 'echarts'
import { getOverviewStats, getTimeSeriesData } from '@/api/stats'
import { User, ChatDotRound, Phone, Connection, UserFilled, Monitor } from '@element-plus/icons-vue'

const trendChartRef = ref()
const hourlyChartRef = ref()
let charts = []

const statCards = ref([])

function formatNum(n) {
  if (!n && n !== 0) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

onMounted(async () => {
  try {
    const overview = await getOverviewStats()
    const stats = {
      ...overview,
      totalUsers: overview.totalUsers,
      currentOnline: overview.onlineCount,
      totalMessages: overview.totalMessages,
      totalGroups: overview.totalGroups,
      newUsersToday: overview.todayNewUsers,
      messagesToday: overview.todayNewMessages,
      newGroupsToday: overview.todayNewGroups,
      totalFriends: overview.totalFriends,
      newFriendsToday: overview.todayNewFriends,
    }

    statCards.value = [
      { label: '总用户数', value: formatNum(stats.totalUsers), icon: markRaw(User), color: '#409eff', trend: `今日 +${stats.newUsersToday}`, trendDir: 'trend-up' },
      { label: '当前在线', value: formatNum(stats.currentOnline), icon: markRaw(UserFilled), color: '#67c23a', trend: '', trendDir: '' },
      { label: '今日消息量', value: formatNum(stats.messagesToday), icon: markRaw(ChatDotRound), color: '#e6a23c', trend: `总计 ${formatNum(stats.totalMessages)}`, trendDir: 'trend-up' },
      { label: '总群组数', value: String(stats.totalGroups), icon: markRaw(Monitor), color: '#9b59b6', trend: `今日 +${stats.newGroupsToday}`, trendDir: 'trend-up' },
      { label: '好友关系', value: formatNum(stats.totalFriends), icon: markRaw(Connection), color: '#1abc9c', trend: `今日 +${stats.newFriendsToday}`, trendDir: 'trend-up' },
    ]

    const trendResponse = await getTimeSeriesData(30)
    const tsData = Array.isArray(trendResponse) ? trendResponse : (trendResponse.points || [])
    const hourly = []

    if (tsData && tsData.length) {
      const trendChart = echarts.init(trendChartRef.value)
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['新增用户', '消息量/100', '新增好友'] },
        grid: { left: 50, right: 20, bottom: 30, top: 40 },
        xAxis: { type: 'category', data: tsData.map(d => d.date) },
        yAxis: { type: 'value' },
        series: [
          { name: '新增用户', type: 'bar', data: tsData.map(d => d.newUsers), itemStyle: { color: '#67c23a' } },
          { name: '消息量/100', type: 'line', data: tsData.map(d => Math.round((d.newMessages || 0) / 100)), smooth: true, itemStyle: { color: '#e6a23c' } },
          { name: '新增好友', type: 'line', data: tsData.map(d => d.newFriends), smooth: true, itemStyle: { color: '#409eff' } },
        ],
      })
      charts.push(trendChart)
    }

    if (hourly && hourly.length) {
      const hourlyChart = echarts.init(hourlyChartRef.value)
      hourlyChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, bottom: 30, top: 20 },
        xAxis: { type: 'category', data: hourly.map(h => h.hour) },
        yAxis: { type: 'value' },
        series: [{
          name: '消息量', type: 'bar', data: hourly.map(h => h.messages),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#79bbff' },
            ]),
          },
        }],
      })
      charts.push(hourlyChart)
    }

    window.addEventListener('resize', handleResize)
  } catch (err) {
    console.error('Dashboard data load failed:', err)
  }
})

function handleResize() {
  charts.forEach(c => c.resize())
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>
