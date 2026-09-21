<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">上传配置</span>
    </div>

    <el-form :model="form" label-width="180px" label-position="left" style="max-width: 600px">
      <el-divider content-position="left">文件大小限制</el-divider>
      <el-form-item label="图片最大尺寸 (MB)">
        <el-input-number v-model="form.maxImageSize" :min="1" :max="50" />
      </el-form-item>
      <el-form-item label="视频最大尺寸 (MB)">
        <el-input-number v-model="form.maxVideoSize" :min="10" :max="500" :step="10" />
      </el-form-item>
      <el-form-item label="文件最大尺寸 (MB)">
        <el-input-number v-model="form.maxFileSize" :min="1" :max="200" :step="5" />
      </el-form-item>
      <el-form-item label="语音最大时长 (秒)">
        <el-input-number v-model="form.maxAudioDuration" :min="10" :max="600" :step="10" />
      </el-form-item>

      <el-divider content-position="left">上传限速</el-divider>
      <el-form-item label="启用上传限速">
        <el-switch v-model="form.uploadRateLimit" />
      </el-form-item>
      <el-form-item label="单用户上传速率 (KB/s)" v-if="form.uploadRateLimit">
        <el-input-number v-model="form.maxUploadRate" :min="100" :max="10240" :step="100" />
      </el-form-item>
      <el-form-item label="并发上传数限制">
        <el-input-number v-model="form.maxConcurrentUploads" :min="1" :max="10" />
      </el-form-item>

      <el-divider content-position="left">允许的文件类型</el-divider>
      <el-form-item label="图片格式">
        <el-checkbox-group v-model="form.allowedImageTypes">
          <el-checkbox value="jpg">JPG</el-checkbox>
          <el-checkbox value="png">PNG</el-checkbox>
          <el-checkbox value="gif">GIF</el-checkbox>
          <el-checkbox value="webp">WebP</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="视频格式">
        <el-checkbox-group v-model="form.allowedVideoTypes">
          <el-checkbox value="mp4">MP4</el-checkbox>
          <el-checkbox value="webm">WebM</el-checkbox>
          <el-checkbox value="mov">MOV</el-checkbox>
        </el-checkbox-group>
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
  maxImageSize: 10,
  maxVideoSize: 100,
  maxFileSize: 50,
  maxAudioDuration: 120,
  uploadRateLimit: false,
  maxUploadRate: 2048,
  maxConcurrentUploads: 3,
  allowedImageTypes: ['jpg', 'png', 'gif', 'webp'],
  allowedVideoTypes: ['mp4', 'webm'],
})

function handleSave() {
  ElMessage.success('上传配置已保存')
}
</script>
