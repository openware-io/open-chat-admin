<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="brand-panel" aria-label="OpenIM 管理后台">
        <div class="brand-mark"><el-icon :size="30"><ChatDotRound /></el-icon></div>
        <div>
          <p class="eyebrow">OPENIM CONSOLE</p>
          <h1>OpenIM 管理后台</h1>
          <p class="brand-copy">
            统一管理用户、消息、安全风控与客户端发布。<br />
            支持统一门户 SSO 免二次登录。
          </p>
        </div>
        <ul class="feature-list">
          <li><span>01</span> 用户、好友与群组治理</li>
          <li><span>02</span> 消息、敏感词与审计追踪</li>
          <li><span>03</span> 客户端发布与小程服务管理</li>
        </ul>
        <a class="portal-link" :href="portalUrl">返回集团统一门户 <span>→</span></a>
      </section>

      <section class="login-card">
        <div class="card-heading">
          <p class="eyebrow">ADMIN SIGN IN</p>
          <h2>登录管理后台</h2>
          <p>使用 IM 管理员账号登录；从统一门户进入时会自动完成 SSO 登录。</p>
        </div>

        <el-alert
          v-if="ssoLoading"
          class="login-alert"
          title="正在通过统一门户登录…"
          type="info"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="errorText"
          class="login-alert"
          :title="errorText"
          type="error"
          :closable="false"
          show-icon
        />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @keyup.enter="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入管理员用户名"
              size="large"
              autocomplete="username"
              :prefix-icon="User"
              :disabled="loading || ssoLoading"
              aria-label="用户名"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              placeholder="请输入密码"
              type="password"
              size="large"
              show-password
              autocomplete="current-password"
              :prefix-icon="Lock"
              :disabled="loading || ssoLoading"
              aria-label="密码"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading || ssoLoading"
              :disabled="ssoLoading"
              class="submit-button"
              @click="handleLogin"
            >
              {{ loading ? '登录中…' : ssoLoading ? 'SSO 登录中…' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <el-link type="primary" @click="router.push('/forgot-password')">忘记密码？</el-link>
          <span class="api-hint">API：{{ apiBase }}</span>
        </div>
        <p class="security-hint">仅限管理员账号访问；登录态和操作会写入审计日志。</p>
      </section>
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
const ssoLoading = ref(false)
const errorText = ref('')
const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const portalUrl = `${window.location.protocol}//${window.location.host}/`

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (loading.value || ssoLoading.value) return
  errorText.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await login({ username: form.username.trim(), password: form.password })
    authStore.setAuth(res.access_token, res.user)
    await router.replace('/dashboard')
    ElMessage.success('登录成功')
  } catch (error) {
    errorText.value = resolveAdminErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 门户 SSO：读取 URL 的一次性 sso_ticket，换取后台 token。
// 票据失败时保留表单，让管理员可以立即改为账号密码登录。
onMounted(async () => {
  const raw = route.query.sso_ticket
  const ssoTicket = Array.isArray(raw) ? raw[0] : raw
  if (!ssoTicket) return
  ssoLoading.value = true
  errorText.value = ''
  try {
    const res = await ssoLogin(ssoTicket)
    authStore.setAuth(res.access_token, res.user)
    await router.replace('/dashboard')
    ElMessage.success('SSO 免登录成功')
  } catch (error) {
    errorText.value = `统一门户登录失败：${resolveAdminErrorMessage(error)}`
  } finally {
    ssoLoading.value = false
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at 10% 0%, rgba(64, 158, 255, 0.22), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(155, 89, 182, 0.14), transparent 30%),
    linear-gradient(135deg, #111827 0%, #1d2433 55%, #0f172a 100%);
}

.login-shell {
  width: min(1060px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 440px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(18px);
}

.brand-panel {
  padding: 52px 48px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 560px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #6d5efc);
  box-shadow: 0 14px 34px rgba(64, 158, 255, 0.32);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.52);
}

.brand-panel h1 {
  margin: 0 0 14px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.brand-copy {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 14px;
  line-height: 1.9;
}

.feature-list {
  list-style: none;
  margin: 30px 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.feature-list span {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: rgba(64, 158, 255, 0.16);
  color: #8fc5ff;
  font-size: 11px;
  font-weight: 700;
}

.portal-link {
  color: #9fd0ff;
  font-size: 13px;
  text-decoration: none;
}

.portal-link span {
  display: inline-block;
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.portal-link:hover span {
  transform: translateX(3px);
}

.login-card {
  background: #fff;
  padding: 48px 42px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-heading {
  margin-bottom: 26px;
}

.card-heading .eyebrow {
  color: #9aa4b4;
}

.card-heading h2 {
  margin: 0 0 10px;
  color: #1d2433;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.card-heading p:not(.eyebrow) {
  margin: 0;
  color: #7b8494;
  font-size: 13px;
  line-height: 1.8;
}

.login-alert {
  margin-bottom: 18px;
}

.submit-button {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}

.api-hint {
  color: #a0a8b5;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.security-hint {
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid #eef1f5;
  color: #a0a8b5;
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
    max-width: 440px;
  }

  .brand-panel {
    min-height: auto;
    padding: 32px 30px;
    gap: 18px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .brand-panel h1 {
    font-size: 26px;
  }

  .brand-copy,
  .feature-list {
    display: none;
  }

  .login-card {
    padding: 34px 28px 28px;
  }
}
</style>
