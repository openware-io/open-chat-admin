<template>
  <div class="admin-page user-sticker-manage">
    <div class="page-header">
      <h2>用户表情管理</h2>
    </div>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>用户自定义表情列表</span>
          <el-form :inline="true" @submit.prevent="handleSearch" style="margin:0">
            <el-form-item style="margin-bottom:0">
              <el-input
                v-model="filterUserId"
                placeholder="按用户 ID 筛选"
                clearable
                style="width:180px"
                @clear="handleSearch"
              />
            </el-form-item>
            <el-form-item style="margin-bottom:0">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon> 搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe border style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户 ID" width="100" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column label="表情" width="100">
          <template #default="{ row }">
            <el-image
              :src="imgUrl(row.thumbnail || row.url)"
              :preview-src-list="[imgUrl(row.url)]"
              fit="contain"
              style="width:60px;height:60px;border-radius:6px;background:#f5f5f5"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" min-width="240" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="添加时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定删除该用户表情？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserStickers, deleteUserSticker } from '@/api/userSticker'
import { resolveUploadUrl } from '@/utils/mediaUrl'
import { resolveAdminErrorMessage } from '@/utils/adminErrorMessage'

function imgUrl(path) {
  return resolveUploadUrl(path || '')
}

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filterUserId = ref('')

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filterUserId.value) params.userId = filterUserId.value
    const res = await getUserStickers(params)
    list.value = res.items || []
    total.value = res.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

async function handleDelete(id) {
  try {
    await deleteUserSticker(id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    ElMessage.error(`删除失败：${resolveAdminErrorMessage(e)}`)
  }
}

loadData()
</script>

<style scoped>
.user-sticker-manage {
  padding: 0;
}
</style>
