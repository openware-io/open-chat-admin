<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>违规记录</h2>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-select v-model="filterAction" placeholder="处理方式" clearable style="width: 130px" @change="loadData">
        <el-option label="警告" value="warned" />
        <el-option label="禁言" value="muted" />
        <el-option label="封禁" value="disabled" />
      </el-select>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe border>
      <el-table-column label="序号" width="64" align="center"><template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template></el-table-column><el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column prop="reason" label="违规原因" width="140" />
      <el-table-column prop="content" label="违规内容" min-width="200" show-overflow-tooltip />
      <el-table-column label="处理方式" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="actionType[row.action]" size="small">{{ actionMap[row.action] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" sortable />
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
import { ref, onMounted } from 'vue'
import { getViolations } from '@/api/security'

const actionMap = { warned: '警告', muted: '禁言', disabled: '封禁' }
const actionType = { warned: 'warning', muted: 'info', disabled: 'danger' }

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filterAction = ref('')

async function loadData() {
  loading.value = true
  try {
    const res = await getViolations({ action: filterAction.value || undefined, page: page.value, pageSize: pageSize.value })
    tableData.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
