<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">推送配置</span>
    </div>

    <el-form :model="form" label-width="160px" label-position="left" style="max-width: 600px">
      <el-divider content-position="left">推送总开关</el-divider>
      <el-form-item label="启用推送">
        <el-switch v-model="form.pushEnabled" />
      </el-form-item>

      <template v-if="form.pushEnabled">
        <el-divider content-position="left">推送渠道</el-divider>
        <el-form-item label="APNs (iOS)">
          <el-switch v-model="form.apnsEnabled" />
        </el-form-item>
        <template v-if="form.apnsEnabled">
          <el-form-item label="APNs Key ID">
            <el-input v-model="form.apnsKeyId" placeholder="Key ID" />
          </el-form-item>
          <el-form-item label="APNs Team ID">
            <el-input v-model="form.apnsTeamId" placeholder="Team ID" />
          </el-form-item>
          <el-form-item label="环境">
            <el-radio-group v-model="form.apnsEnvironment">
              <el-radio value="development">开发</el-radio>
              <el-radio value="production">生产</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <el-form-item label="FCM (Android)">
          <el-switch v-model="form.fcmEnabled" />
        </el-form-item>
        <el-form-item label="FCM Server Key" v-if="form.fcmEnabled">
          <el-input v-model="form.fcmServerKey" type="password" show-password placeholder="Server Key" />
        </el-form-item>

        <el-form-item label="华为推送">
          <el-switch v-model="form.huaweiEnabled" />
        </el-form-item>
        <el-form-item label="小米推送">
          <el-switch v-model="form.xiaomiEnabled" />
        </el-form-item>

        <el-divider content-position="left">推送策略</el-divider>
        <el-form-item label="免打扰时段">
          <el-switch v-model="form.dndEnabled" />
        </el-form-item>
        <el-form-item label="免打扰时间" v-if="form.dndEnabled">
          <el-time-picker v-model="form.dndStart" placeholder="开始时间" style="width: 140px" /> —
          <el-time-picker v-model="form.dndEnd" placeholder="结束时间" style="width: 140px" />
        </el-form-item>
        <el-form-item label="推送合并间隔 (秒)">
          <el-input-number v-model="form.mergeInterval" :min="0" :max="300" :step="5" />
        </el-form-item>
      </template>

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
  pushEnabled: true,
  apnsEnabled: false,
  apnsKeyId: '',
  apnsTeamId: '',
  apnsEnvironment: 'development',
  fcmEnabled: false,
  fcmServerKey: '',
  huaweiEnabled: false,
  xiaomiEnabled: false,
  dndEnabled: false,
  dndStart: null,
  dndEnd: null,
  mergeInterval: 10,
})

function handleSave() {
  ElMessage.success('推送配置已保存')
}
</script>
