<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索用户名 / 昵称" clearable
        style="width: 240px" @clear="loadData" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="用户状态" clearable style="width: 140px" @change="loadData">
        <el-option label="正常" value="active" />
        <el-option label="禁用" value="disabled" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Search /></el-icon> 查询
      </el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
      <el-table-column label="序号" width="64" align="center"><template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template></el-table-column><el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="头像" width="70">
        <template #default="{ row }">
          <el-avatar :size="36" :src="row.avatar" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="signature" label="签名" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
            {{ row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170" sortable>
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">
            <el-icon><View /></el-icon> 详情
          </el-button>
          <!-- 管理员账号一律不可删：后端 409 ADMIN_ACCOUNT_UNDELETABLE，前端直接不给入口，避免误点 -->
          <el-button v-if="!isAdminAccount(row)" link type="danger" @click="openDeleteDialog(row)">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
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

    <el-drawer v-model="drawerVisible" title="用户详情" size="400px">
      <template v-if="currentUser">
        <div style="text-align: center; margin-bottom: 20px">
          <el-avatar :size="80" :src="currentUser.avatar" />
          <h3 style="margin: 12px 0 4px">{{ currentUser.nickname }}</h3>
          <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'" size="small">
            {{ currentUser.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="签名">{{ currentUser.signature || '无' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatTime(currentUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(currentUser.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!--
      删除二次确认刻意用应用内 el-dialog，而不是 ElMessageBox.prompt：
      真机上 ElMessageBox 的确认按钮可能无响应并残留遮罩节点，导致页面点不动。
    -->
    <el-dialog v-model="deleteDialogVisible" title="删除用户" width="460px" :close-on-click-modal="false"
      @closed="resetDeleteDialog">
      <template v-if="deleteTarget">
        <el-alert type="error" :closable="false" show-icon
          title="删除后不可恢复：账号登录态、设备密钥、通知设置、密保、收藏、好友与群成员关系都会被清理；"
          description="IM 消息本体保留（不会把对方的聊天记录删出空洞）。账号用户名会变成 deleted_<ID>_<随机码>。" />
        <p class="delete-hint">
          请输入要删除的用户名 <strong>{{ deleteTarget.username }}</strong> 以确认：
        </p>
        <el-input v-model="confirmUsername" placeholder="输入完整用户名" clearable
          @keyup.enter="confirmDelete" />
        <p v-if="confirmUsername && !usernameMatched" class="delete-mismatch">
          用户名与目标账号不一致，无法确认删除。
        </p>
      </template>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :disabled="!usernameMatched" :loading="deleting" @click="confirmDelete">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { deleteUser, getUsers } from '@/api/user'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', status: '' })

const drawerVisible = ref(false)
const currentUser = ref(null)

const deleteDialogVisible = ref(false)
const deleteTarget = ref(null)
const confirmUsername = ref('')
const deleting = ref(false)

const usernameMatched = computed(() => {
  const expected = deleteTarget.value?.username
  return Boolean(expected) && confirmUsername.value.trim() === expected
})

function isAdminAccount(row) {
  return row?.role === 'admin'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getUsers({ ...filters, page: page.value, pageSize: pageSize.value })
    tableData.value = res.items || []
    total.value = res.total || 0
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  currentUser.value = row
  drawerVisible.value = true
}

function openDeleteDialog(row) {
  deleteTarget.value = row
  confirmUsername.value = ''
  deleteDialogVisible.value = true
}

function resetDeleteDialog() {
  deleteTarget.value = null
  confirmUsername.value = ''
  deleting.value = false
}

async function confirmDelete() {
  if (!usernameMatched.value || deleting.value) {
    return
  }
  deleting.value = true
  try {
    const result = await deleteUser(deleteTarget.value.id, confirmUsername.value.trim())
    const cascade = result?.cascade || {}
    ElMessage.success(
      `已删除用户 ${result?.username || deleteTarget.value.username}：`
      + `设备会话 ${cascade.deviceSessions || 0}、设备密钥 ${cascade.deviceKeys || 0}、`
      + `收藏 ${cascade.favorites || 0}、好友关系 ${cascade.friendRelations || 0}、`
      + `群成员 ${cascade.groupMembers || 0}（消息本体已保留）`
    )
    deleteDialogVisible.value = false
    loadData()
  } catch {
    // 失败原因由 request.js 拦截器按后端错误码统一转成中文提示（管理员不可删 / 用户名不一致 / 权限不足）
    deleting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.delete-hint {
  margin: 16px 0 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.delete-mismatch {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-color-danger);
}
</style>
