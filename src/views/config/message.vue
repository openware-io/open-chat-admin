<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">消息配置</span>
    </div>

    <el-form :model="form" label-width="160px" label-position="left" style="max-width: 600px">
      <el-divider content-position="left">消息存储</el-divider>
      <el-form-item label="消息存储时长 (天)">
        <el-input-number v-model="form.messageRetentionDays" :min="7" :max="365" :step="7" />
      </el-form-item>
      <el-form-item label="离线消息保留 (天)">
        <el-input-number v-model="form.offlineRetentionDays" :min="1" :max="30" />
      </el-form-item>

      <el-divider content-position="left">功能开关</el-divider>
      <el-form-item label="单聊功能">
        <el-switch v-model="form.privateChatEnabled" />
      </el-form-item>
      <el-form-item label="群聊功能">
        <el-switch v-model="form.groupChatEnabled" />
      </el-form-item>
      <el-form-item label="消息撤回">
        <el-switch v-model="form.recallEnabled" />
      </el-form-item>
      <el-form-item label="撤回时限 (分钟)" v-if="form.recallEnabled">
        <el-input-number v-model="form.recallTimeLimit" :min="1" :max="60" />
      </el-form-item>
      <el-form-item label="已读回执">
        <el-switch v-model="form.readReceiptEnabled" />
      </el-form-item>
      <el-form-item label="输入状态提示">
        <el-switch v-model="form.typingIndicatorEnabled" />
      </el-form-item>

      <el-divider content-position="left">群组设置</el-divider>
      <el-form-item label="最大群成员数">
        <el-input-number v-model="form.maxGroupMembers" :min="10" :max="2000" :step="10" />
      </el-form-item>
      <el-form-item label="每人可创建群数">
        <el-input-number v-model="form.maxGroupsPerUser" :min="1" :max="100" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const form = reactive({
  messageRetentionDays: 90,
  offlineRetentionDays: 7,
  privateChatEnabled: true,
  groupChatEnabled: true,
  recallEnabled: true,
  recallTimeLimit: 2,
  readReceiptEnabled: true,
  typingIndicatorEnabled: true,
  maxGroupMembers: 500,
  maxGroupsPerUser: 20,
})

function handleSave() {
  ElMessage.success('消息配置已保存')
}
</script>
