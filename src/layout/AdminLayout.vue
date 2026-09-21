<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="router.push('/')">
        <el-icon :size="24"><ChatDotRound /></el-icon>
        <span v-show="!isCollapse" class="logo-text">GV Chat</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :router="true"
        background-color="#1d1e2c"
        text-color="#a3a6ad"
        active-text-color="#409eff"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>

        <el-sub-menu index="user-group">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户与社交</span>
          </template>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item index="/account-cancellations">
            <el-icon><Delete /></el-icon>
            <template #title>账号注销管理</template>
          </el-menu-item>
          <el-menu-item index="/friends">
            <el-icon><Connection /></el-icon>
            <template #title>好友管理</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="false" index="monitor-group">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>运维监控</span>
          </template>
          <el-menu-item index="/monitor/realtime">
            <el-icon><View /></el-icon>
            <template #title>实时状态</template>
          </el-menu-item>
          <el-menu-item index="/monitor/server">
            <el-icon><Cpu /></el-icon>
            <template #title>服务器监控</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="security-group">
          <template #title>
            <el-icon><WarningFilled /></el-icon>
            <span>安全风控</span>
          </template>
          <el-menu-item index="/security/keywords">
            <el-icon><Warning /></el-icon>
            <template #title>敏感词管理</template>
          </el-menu-item>
          <el-menu-item index="/security/violations">
            <el-icon><CircleClose /></el-icon>
            <template #title>违规记录</template>
          </el-menu-item>
          <el-menu-item index="/security/reports">
            <el-icon><Bell /></el-icon>
            <template #title>举报中心</template>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/user-stickers">
          <el-icon><Star /></el-icon>
          <template #title>用户表情管理</template>
        </el-menu-item>

        <el-menu-item index="/device-tokens">
          <el-icon><Iphone /></el-icon>
          <template #title>设备推送令牌</template>
        </el-menu-item>

        <el-menu-item index="/miniapp/service-manage">
          <el-icon><Cellphone /></el-icon>
          <template #title>小程序 · 服务管理</template>
        </el-menu-item>

        <el-menu-item index="/open-platform/applications">
          <el-icon><Link /></el-icon>
          <template #title>第三方接入</template>
        </el-menu-item>

        <el-menu-item index="/config/client-releases">
          <el-icon><Upload /></el-icon>
          <template #title>客户端发布</template>
        </el-menu-item>

        <el-menu-item index="/audit-logs">
          <el-icon><Document /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>

        <el-menu-item index="/config">
          <el-icon><Setting /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse" :size="20">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-link class="unified-entry" :href="unifiedEntryUrl" target="_blank" rel="noopener noreferrer" :underline="false">
            <el-icon><Compass /></el-icon>
            <span>统一入口</span>
          </el-link>
          <el-breadcrumb class="header-breadcrumb" separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title || '页面' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <span class="username">{{ authStore.user?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapse = ref(false)
const unifiedEntryUrl = import.meta.env.VITE_UNIFIED_ENTRY_URL || 'https://saas-admin.dev.example.com'
/* realtime notifications are intentionally not enabled for the REST-only admin v1 client */
/*
  const token = localStorage.getItem('admin_token')
  if (!token) return
  socket = io(window.location.origin, { path: '/socket.io', auth: { token }, transports: ['websocket', 'polling'] })
  socket.on('reservation:created', (payload) => {
    ElNotification({
      title: '新预约通知',
      message: `${payload.serviceTypeName || ''} · ${payload.storeName || ''} · ${payload.contactName || ''} · ${payload.reserveDate || ''} ${payload.reserveTimePeriod || ''}`,
      type: 'warning',
      duration: 5000,
      onClick: () => router.push({ path: '/reservations/orders', query: { orderNo: payload.orderNo } }),
    })
  })
})

*/

function handleCommand(cmd) {
  if (cmd === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  background: var(--sidebar-bg);
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.sidebar-menu::-webkit-scrollbar {
  width: 0;
}

.header {
  height: var(--header-height);
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: none;
  z-index: 10;
}

.header-breadcrumb :deep(.el-breadcrumb__inner) {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.header-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--el-text-color-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #409eff;
}

.unified-entry {
  font-weight: 500;
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.main-content {
  background: var(--admin-bg, #f0f2f5);
  padding: 20px 22px 24px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
