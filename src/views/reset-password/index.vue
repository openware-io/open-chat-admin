<template>
  <div class="reset-page">
    <div class="reset-card">
      <template v-if="submitted">
        <div class="reset-header">
          <el-icon :size="40" color="#67c23a"><CircleCheckFilled /></el-icon>
          <h1>密码已重置，请登录</h1>
          <p>您的新密码已生效，请使用新密码登录管理后台。</p>
        </div>
        <el-button type="primary" size="large" style="width: 100%" @click="goLogin">
          前往登录
        </el-button>
      </template>

      <template v-else-if="!token">
        <div class="reset-header">
          <el-icon :size="40" color="#f56c6c"><CircleCloseFilled /></el-icon>
          <h1>重置链接无效</h1>
          <p>缺少重置令牌，请通过邮件中的链接重新访问。</p>
        </div>
        <el-button type="primary" size="large" style="width: 100%" @click="goForgot">
          重新获取重置邮件
        </el-button>
        <div class="reset-links">
          <el-link type="primary" @click="goLogin">返回登录</el-link>
        </div>
      </template>

      <template v-else>
        <div class="reset-header">
          <el-icon :size="40" color="#409eff"><Lock /></el-icon>
          <h1>重置密码</h1>
          <p>请输入您的新密码</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleSubmit">
          <el-form-item prop="newPassword">
            <el-input v-model="form.newPassword" placeholder="新密码（6-128 位）" type="password"
              size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" placeholder="确认密码" type="password"
              size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleSubmit"
              style="width: 100%">
              确认重置
            </el-button>
          </el-form-item>
        </el-form>
        <div class="reset-links">
          <el-link type="primary" @click="goForgot">没有收到邮件？重新获取</el-link>
          <el-link @click="goLogin">返回登录</el-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { resetPassword } from '@/api/auth'
import { notifyAdminRequestError } from '@/utils/adminErrorMessage'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitted = ref(false)

const token = computed(() => (route.query.token || '').toString().trim())

const form = reactive({ newPassword: '', confirmPassword: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 128, message: '密码长度需为 6-128 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

function goLogin() {
  router.replace('/login')
}

function goForgot() {
  router.replace('/forgot-password')
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await resetPassword(token.value, form.newPassword)
    submitted.value = true
    ElMessage.success('密码已重置，请登录')
  } catch (err) {
    const status = err?.response?.status
    if (status === 401) {
      ElMessage.error('重置链接无效或已过期，请重新获取')
    } else if (status === 400) {
      ElMessage.error('提交内容校验未通过，请检查后重试')
    } else {
      notifyAdminRequestError(err)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d1e2c 0%, #2c3e50 50%, #1a1a2e 100%);
}

.reset-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.reset-header {
  text-align: center;
  margin-bottom: 28px;
}

.reset-header h1 {
  margin: 12px 0 8px;
  font-size: 22px;
  color: #303133;
}

.reset-header p {
  color: #909399;
  font-size: 14px;
}

.reset-links {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
</style>
