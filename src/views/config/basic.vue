<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">基础配置</span>
    </div>

    <el-form :model="form" label-width="140px" label-position="left" style="max-width: 600px">
      <el-divider content-position="left">应用信息</el-divider>
      <el-form-item label="APP 名称">
        <el-input v-model="form.appName" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="APP 版本">
        <el-input v-model="form.appVersion" placeholder="当前版本号" />
      </el-form-item>
      <el-form-item label="客服链接">
        <el-input v-model="form.supportUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="隐私政策链接">
        <el-input v-model="form.privacyUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="用户协议链接">
        <el-input v-model="form.termsUrl" placeholder="https://..." />
      </el-form-item>

      <el-divider content-position="left">公告设置</el-divider>
      <el-form-item label="系统公告">
        <el-input v-model="form.announcement" type="textarea" :rows="4" placeholder="输入系统公告内容，留空则不显示" />
      </el-form-item>
      <el-form-item label="公告开关">
        <el-switch v-model="form.announcementEnabled" />
      </el-form-item>

      <el-divider content-position="left">维护模式</el-divider>
      <el-form-item label="维护模式">
        <el-switch v-model="form.maintenanceMode" active-color="#f56c6c" />
      </el-form-item>
      <el-form-item label="维护提示" v-if="form.maintenanceMode">
        <el-input v-model="form.maintenanceMessage" type="textarea" :rows="2" placeholder="维护提示信息" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const defaultConfig = {
  appName: 'OpenIM',
  appVersion: '1.0.5',
  supportUrl: 'https://support.gvchat.com',
  privacyUrl: 'https://gvchat.com/privacy',
  termsUrl: 'https://gvchat.com/terms',
  announcement: '欢迎使用 OpenIM 即时通讯平台！',
  announcementEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，预计 30 分钟后恢复...',
}

const form = reactive({ ...defaultConfig })

function handleSave() {
  ElMessage.success('基础配置已保存')
}

function resetForm() {
  Object.assign(form, defaultConfig)
  ElMessage.info('已重置为默认值')
}
</script>
