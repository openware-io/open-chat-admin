<template>
  <div class="forgot-page">
    <div class="forgot-card">
      <div class="forgot-header">
        <el-icon :size="40" color="#409eff"><Message /></el-icon>
        <h1>找回密码</h1>
        <p>输入注册邮箱，我们会发送一封密码重置邮件</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleSubmit">
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱地址" size="large" :prefix-icon="Message" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleSubmit"
            style="width: 100%">
            发送重置邮件
          </el-button>
        </el-form-item>
      </el-form>
      <div class="forgot-tip">
        邮件发送后请查收收件箱，链接 30 分钟内有效。
      </div>
      <div class="forgot-links">
        <el-link type="primary" @click="goLogin">返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { forgotPassword } from '@/api/auth'
import { notifyAdminRequestError } from '@/utils/adminErrorMessage'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ email: '' })

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

function goLogin() {
  router.replace('/login')
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await forgotPassword(form.email.trim())
    ElMessage.success('重置邮件已发送，请查收邮箱')
  } catch (err) {
    const status = err?.response?.status
    if (status === 400) {
      ElMessage.error('请输入正确的邮箱地址')
    } else {
      notifyAdminRequestError(err)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d1e2c 0%, #2c3e50 50%, #1a1a2e 100%);
}

.forgot-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.forgot-header {
  text-align: center;
  margin-bottom: 28px;
}

.forgot-header h1 {
  margin: 12px 0 8px;
  font-size: 22px;
  color: #303133;
}

.forgot-header p {
  color: #909399;
  font-size: 14px;
}

.forgot-tip {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  margin-top: 8px;
}

.forgot-links {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
