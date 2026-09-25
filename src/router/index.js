import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/forgot-password/index.vue'),
    meta: { title: '找回密码', public: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/reset-password/index.vue'),
    meta: { title: '重置密码', public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'DataBoard' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'account-cancellations',
        name: 'AccountCancellations',
        component: () => import('@/views/account-cancellation/index.vue'),
        meta: { title: '账号注销管理', icon: 'Delete' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/message/index.vue'),
        meta: { title: '消息管理', icon: 'ChatDotRound' },
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/views/friend/index.vue'),
        meta: { title: '好友管理', icon: 'Connection' },
      },
      {
        path: 'monitor/realtime',
        name: 'RealtimeMonitor',
        component: () => import('@/views/monitor/realtime.vue'),
        meta: { title: '实时状态监控', icon: 'Monitor' },
      },
      {
        path: 'monitor/server',
        name: 'ServerMonitor',
        component: () => import('@/views/monitor/server.vue'),
        meta: { title: '服务器监控', icon: 'Cpu' },
      },
      {
        path: 'security/keywords',
        name: 'Keywords',
        component: () => import('@/views/security/keywords.vue'),
        meta: { title: '敏感词管理', icon: 'Warning' },
      },
      {
        path: 'security/violations',
        name: 'Violations',
        component: () => import('@/views/security/violations.vue'),
        meta: { title: '违规记录', icon: 'CircleClose' },
      },
      {
        path: 'security/reports',
        name: 'Reports',
        component: () => import('@/views/security/reports.vue'),
        meta: { title: '举报中心', icon: 'Bell' },
      },
      {
        path: 'user-stickers',
        name: 'UserStickers',
        component: () => import('@/views/user-sticker/index.vue'),
        meta: { title: '用户表情管理', icon: 'Star' },
      },
      {
        path: 'device-tokens',
        name: 'DeviceTokens',
        component: () => import('@/views/device-token/index.vue'),
        meta: { title: '设备推送令牌', icon: 'Iphone' },
      },
      {
        path: 'miniapp/service-manage',
        name: 'MiniappServiceManage',
        component: () => import('@/views/miniapp/service-manage.vue'),
        meta: { title: '服务管理', icon: 'Grid' },
      },
      { path: 'miniapp/service-types', redirect: '/miniapp/service-manage' },
      { path: 'miniapp/services', redirect: '/miniapp/service-manage' },
      {
        path: 'open-platform/applications',
        name: 'OpenPlatformApplications',
        component: () => import('@/views/open-platform/applications.vue'),
        meta: { title: '第三方接入', icon: 'Link' },
      },
      {
        path: 'config/client-releases',
        name: 'ClientReleases',
        component: () => import('@/views/config/client-releases.vue'),
        meta: { title: '客户端发布', icon: 'Upload' },
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '审计日志', icon: 'Document' },
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('@/views/config/index.vue'),
        meta: { title: '系统配置', icon: 'Setting' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'OpenIM'} - 管理后台`
  const token = localStorage.getItem('admin_token')
  if (!to.meta.public && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
