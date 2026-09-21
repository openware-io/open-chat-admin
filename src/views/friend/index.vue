<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>好友管理</h2>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索用户昵称 / 备注" clearable
        style="width: 240px" @clear="loadData" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="好友状态" clearable style="width: 130px" @change="loadData">
        <el-option label="正常" value="normal" />
        <el-option label="已拉黑" value="blocked" />
      </el-select>
      <el-select v-model="filters.groupName" placeholder="分组" clearable style="width: 130px" @change="loadData">
        <el-option label="默认分组" value="默认分组" />
        <el-option label="同事" value="同事" />
        <el-option label="朋友" value="朋友" />
        <el-option label="家人" value="家人" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Search /></el-icon> 查询
      </el-button>
      <el-button @click="resetFilters">
        <el-icon><Refresh /></el-icon> 重置
      </el-button>
    </div>

    <template v-if="filters.keyword">
      <div class="page-header" style="margin: 16px 0 8px">
        <h3>匹配用户</h3>
      </div>
      <el-table :data="userResults" v-loading="loading" empty-text="未找到匹配用户" stripe border style="width: 100%; margin-bottom: 16px">
        <el-table-column type="index" label="序号" width="64" align="center" />
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="nickname" label="昵称" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <div class="page-header" style="margin: 16px 0 8px">
      <h3>好友关系</h3>
    </div>

    <el-table :data="tableData" v-loading="loading" empty-text="暂无匹配的好友关系" stripe border style="width: 100%">
      <el-table-column label="序号" width="64" align="center">
        <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userId" label="用户ID" width="90" />
      <el-table-column prop="userNickname" label="用户昵称" width="120" />
      <el-table-column prop="friendId" label="好友ID" width="90" />
      <el-table-column prop="friendNickname" label="好友昵称" width="120" />
      <el-table-column prop="remark" label="备注" width="120" />
      <el-table-column prop="groupName" label="分组" width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ row.groupName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
            {{ row.status === 'normal' ? '正常' : '已拉黑' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="添加时间" width="190" sortable>
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
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
import { ElMessage } from 'element-plus'
import { getFriends } from '@/api/friend'
import { getUsers } from '@/api/user'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const userResults = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', status: '', groupName: '' })

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.groupName = ''
  page.value = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const usersPromise = filters.keyword
      ? getUsers({ keyword: filters.keyword, page: 1, pageSize: 20 })
      : Promise.resolve(null)
    const [friends, users] = await Promise.all([
      getFriends({ ...filters, page: page.value, pageSize: pageSize.value }),
      usersPromise,
    ])
    tableData.value = friends.items || []
    total.value = friends.total || 0
    userResults.value = users?.items || []
    if (filters.keyword && userResults.value.length === 0 && total.value === 0) {
      ElMessage.info('未找到匹配用户或好友关系')
    } else if (!filters.keyword && (filters.status || filters.groupName) && total.value === 0) {
      ElMessage.info('没有匹配的好友关系')
    }
  } catch {
    tableData.value = []
    userResults.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
