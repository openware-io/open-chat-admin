<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#409eff"><ChatDotRound /></el-icon>
        <h1>GV Chat 管理后台</h1>
        <p>即时通讯后台管理系统</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" type="password" size="large"
            :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin"
            style="width: 100%">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        使用管理员账号登录（需要 admin 角色）
      </div>
      <div class="login-links">
        <el-link type="primary" @click="router.push('/forgot-password')">忘记密码？</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login, ssoLogin } from '@/api/auth'
import { resolveAdminErrorMessage } from '@/utils/adminErrorMessage'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res = await login({ username: form.username, password: form.password })
    authStore.setAuth(res.access_token, res.user)
    await router.replace('/dashboard')
    ElMessage.success('登录成功')
  } catch (err) {
    console.error('Admin login navigation failed', err)
  } finally {
    loading.value = false
  }
}

// 门户 SSO 免二次登录：读取 URL 的一次性 sso_ticket，调 /auth/sso 换后台 token 并自动登录。
onMounted(async () => {
  const raw = route.query.sso_ticket
  const ssoTicket = Array.isArray(raw) ? raw[0] : raw
  if (!ssoTicket) return
  loading.value = true
  try {
    const res = await ssoLogin(ssoTicket)
    authStore.setAuth(res.access_token, res.user)
    await router.replace('/dashboard')
    ElMessage.success('SSO 免登录成功')
  } catch (err) {
    ElMessage.error('SSO 登录失败：' + resolveAdminErrorMessage(err))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d1e2c 0%, #2c3e50 50%, #1a1a2e 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 12px 0 8px;
  font-size: 24px;
  color: #303133;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-tip {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  margin-top: 8px;
}

.login-links {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
