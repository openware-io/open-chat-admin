<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>举报处理中心</h2>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="举报状态" clearable style="width: 130px" @change="loadData">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已驳回" value="dismissed" />
      </el-select>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe border>
      <el-table-column label="序号" width="64" align="center"><template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template></el-table-column><el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="reporterId" label="举报人ID" width="100" />
      <el-table-column prop="targetId" label="被举报人ID" width="100" />
      <el-table-column prop="reason" label="举报原因" width="120" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="举报时间" width="170" sortable />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending' || row.status === 'processing'">
            <el-button link type="primary" size="small" @click="handle(row, 'resolved')">通过</el-button>
            <el-button link type="danger" size="small" @click="handle(row, 'dismissed')">驳回</el-button>
            <el-button link type="warning" size="small" @click="handle(row, 'processing')"
              v-if="row.status === 'pending'">处理中</el-button>
          </template>
          <el-tag v-else :type="statusType[row.status]" size="small">
            {{ statusMap[row.status] }}
          </el-tag>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getReports, handleReport } from '@/api/security'

const statusMap = { pending: '待处理', processing: '处理中', resolved: '已解决', dismissed: '已驳回' }
const statusType = { pending: 'danger', processing: 'warning', resolved: 'success', dismissed: 'info' }

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filterStatus = ref('')

async function loadData() {
  loading.value = true
  try {
    const res = await getReports({ status: filterStatus.value || undefined, page: page.value, pageSize: pageSize.value })
    tableData.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function handle(row, status) {
  await handleReport(row.id, { status })
  row.status = status
  ElMessage.success(`已${statusMap[status]}`)
}

onMounted(loadData)
</script>
