<template>
  <div class="admin-page page-card">
    <div class="page-header">
      <span class="page-title">通话配置</span>
    </div>

    <el-form :model="form" label-width="180px" label-position="left" style="max-width: 600px">
      <el-divider content-position="left">视频通话</el-divider>
      <el-form-item label="视频通话功能">
        <el-switch v-model="form.videoCallEnabled" />
      </el-form-item>
      <el-form-item label="默认清晰度" v-if="form.videoCallEnabled">
        <el-radio-group v-model="form.defaultVideoQuality">
          <el-radio value="360p">360p</el-radio>
          <el-radio value="480p">480p</el-radio>
          <el-radio value="720p">720p</el-radio>
          <el-radio value="1080p">1080p</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="最大视频码率 (kbps)" v-if="form.videoCallEnabled">
        <el-slider v-model="form.maxVideoBitrate" :min="200" :max="4000" :step="100" show-input />
      </el-form-item>
      <el-form-item label="最大帧率 (fps)" v-if="form.videoCallEnabled">
        <el-select v-model="form.maxVideoFps" style="width: 120px">
          <el-option :value="15" label="15 fps" />
          <el-option :value="24" label="24 fps" />
          <el-option :value="30" label="30 fps" />
          <el-option :value="60" label="60 fps" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">语音通话</el-divider>
      <el-form-item label="语音通话功能">
        <el-switch v-model="form.audioCallEnabled" />
      </el-form-item>
      <el-form-item label="音频码率 (kbps)" v-if="form.audioCallEnabled">
        <el-slider v-model="form.audioBitrate" :min="16" :max="128" :step="8" show-input />
      </el-form-item>

      <el-divider content-position="left">通话限制</el-divider>
      <el-form-item label="单次通话时长上限 (分钟)">
        <el-input-number v-model="form.maxCallDuration" :min="5" :max="480" :step="5" />
      </el-form-item>
      <el-form-item label="最大参与人数">
        <el-input-number v-model="form.maxCallParticipants" :min="2" :max="16" />
      </el-form-item>

      <el-divider content-position="left">TURN 服务</el-divider>
      <el-form-item label="TURN 服务器地址">
        <el-input v-model="form.turnServer" placeholder="turn:your-server:3478" />
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
  videoCallEnabled: true,
  defaultVideoQuality: '720p',
  maxVideoBitrate: 1500,
  maxVideoFps: 30,
  audioCallEnabled: true,
  audioBitrate: 48,
  maxCallDuration: 120,
  maxCallParticipants: 4,
  turnServer: 'turn:coturn.example.com:3478',
})

function handleSave() {
  ElMessage.success('通话配置已保存')
}
</script>
