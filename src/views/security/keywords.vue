<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>敏感词库管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 添加敏感词
      </el-button>
    </div>

    <div class="admin-card">
    <div class="filter-bar">
      <el-select v-model="filterCategory" placeholder="分类" clearable style="width: 130px" @change="loadData">
        <el-option label="政治敏感" value="politics" />
        <el-option label="色情" value="porn" />
        <el-option label="广告" value="ads" />
        <el-option label="辱骂" value="abuse" />
      </el-select>
      <el-select v-model="filterLevel" placeholder="级别" clearable style="width: 130px" @change="loadData">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
      </el-select>
    </div>

    <el-table :data="filteredList" v-loading="loading" stripe border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="word" label="敏感词" min-width="150" />
      <el-table-column label="分类" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ categoryMap[row.category] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="级别" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="levelType[row.level]" size="small">{{ levelMap[row.level] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" size="small" @change="handleToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑敏感词' : '添加敏感词'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="form.word" placeholder="请输入敏感词" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
            <el-option label="政治敏感" value="politics" />
            <el-option label="色情" value="porn" />
            <el-option label="广告" value="ads" />
            <el-option label="辱骂" value="abuse" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-radio-group v-model="form.level">
            <el-radio value="low">低</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="high">高</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKeywords, addKeyword, updateKeyword, deleteKeyword } from '@/api/security'

const categoryMap = { politics: '政治敏感', porn: '色情', ads: '广告', abuse: '辱骂' }
const levelMap = { low: '低', medium: '中', high: '高' }
const levelType = { low: 'info', medium: 'warning', high: 'danger' }

const loading = ref(false)
const submitting = ref(false)
const keywords = ref([])
const filterCategory = ref('')
const filterLevel = ref('')

const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ word: '', category: '', level: 'medium' })
const rules = {
  word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

const filteredList = computed(() => {
  let list = [...keywords.value]
  if (filterCategory.value) list = list.filter(k => k.category === filterCategory.value)
  if (filterLevel.value) list = list.filter(k => k.level === filterLevel.value)
  return list
})

async function loadData() {
  loading.value = true
  try {
    const data = await getKeywords({ page: 1, pageSize: 200 })
    keywords.value = (data.items || []).map(k => ({ ...k, enabled: !!k.enabled }))
  } catch {
    keywords.value = []
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    Object.assign(form, { word: row.word, category: row.category, level: row.level })
  } else {
    editingId.value = null
    Object.assign(form, { word: '', category: '', level: 'medium' })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await updateKeyword(editingId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await addKeyword({ ...form })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除敏感词 "${row.word}" 吗？`, '提示', { type: 'warning' })
  await deleteKeyword(row.id)
  ElMessage.success('删除成功')
  loadData()
}

async function handleToggle(row) {
  await updateKeyword(row.id, { enabled: row.enabled })
  ElMessage.success(row.enabled ? '已启用' : '已禁用')
}

onMounted(loadData)
</script>
