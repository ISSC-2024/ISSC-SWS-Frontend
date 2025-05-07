<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Form, Input, Button, message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import AuthService from '../services/AuthService'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
// 登录类型
const loginType = ref('user') // 默认为用户登录

// 切换登录类型
const switchLoginType = (type: string) => {
  loginType.value = type
  // 清空表单
  formState.username = ''
  formState.password = ''
}

// 表单状态
const formState = reactive({
  username: '',
  password: '',
})

// 表单校验规则
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }] as Rule[],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }] as Rule[],
}

// 登录处理
const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    // 使用认证服务进行登录验证，传递登录类型
    const authResult = await AuthService.login(
      {
        username: formState.username,
        password: formState.password,
      },
      loginType.value,
    ) // 传递登录类型

    if (authResult.success) {
      // 显示成功消息
      message.success(authResult.message)

      // 跳转到行业选择页面
      setTimeout(() => {
        router.push('/industry-selection')
        loading.value = false
      }, 1000)
    } else {
      // 显示错误消息
      message.error(authResult.message)
      loading.value = false
    }
  } catch (error) {
    console.log('表单验证失败:', error)
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="tech-background">
      <div class="grid-lines"></div>
      <div class="glow-sphere"></div>
      <div class="floating-particles">
        <span v-for="i in 12" :key="i" class="particle" :class="`p${i}`"></span>
      </div>
    </div>

    <div class="login-card">
      <div class="card-decoration">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
      </div>

      <h1 class="login-title">全域互联的工业智能体协同平台</h1>
      <div class="title-underline"></div>

      <!-- 登录类型切换按钮 -->
      <div class="login-type-switch">
        <Button
          :type="loginType === 'admin' ? 'primary' : 'default'"
          @click="switchLoginType('admin')"
          class="switch-btn"
          :class="{ active: loginType === 'admin' }"
        >
          管理员登录
        </Button>
        <Button
          :type="loginType === 'user' ? 'primary' : 'default'"
          @click="switchLoginType('user')"
          class="switch-btn"
          :class="{ active: loginType === 'user' }"
        >
          企业登录
        </Button>
      </div>

      <Form layout="vertical" :model="formState" :rules="rules" ref="formRef" class="login-form">
        <Form.Item name="username">
          <Input v-model:value="formState.username" size="large" placeholder="用户名" class="styled-input">
            <template #prefix>
              <UserOutlined />
            </template>
          </Input>
        </Form.Item>

        <Form.Item name="password">
          <Input.Password v-model:value="formState.password" size="large" placeholder="密码" class="styled-input">
            <template #prefix>
              <LockOutlined />
            </template>
          </Input.Password>
        </Form.Item>

        <Form.Item>
          <Button type="primary" size="large" block @click="handleLogin" :loading="loading" class="login-button">
            <span class="btn-text">登录</span>
            <span class="btn-shine"></span>
          </Button>
        </Form.Item>
      </Form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a1428 0%, #0e1a30 100%);
}

/* 科技感背景元素 */
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(32, 160, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(32, 160, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 1;
}

.glow-sphere {
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(32, 160, 255, 0.05) 0%,
    rgba(32, 160, 255, 0.03) 30%,
    rgba(32, 160, 255, 0) 70%
  );
  left: calc(50% - 400px);
  top: calc(50% - 400px);
  filter: blur(40px);
  animation: pulsate 10s infinite alternate;
  z-index: 2;
}

.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(32, 160, 255, 0.5);
  border-radius: 50%;
  filter: blur(1px);
  box-shadow: 0 0 6px rgba(32, 160, 255, 0.8);
  animation: float 20s infinite linear;
}

/* 随机粒子位置和动画 */
.p1 {
  top: 10%;
  left: 20%;
  animation-duration: 25s;
  animation-delay: 0s;
}
.p2 {
  top: 30%;
  left: 85%;
  animation-duration: 22s;
  animation-delay: 1s;
}
.p3 {
  top: 70%;
  left: 15%;
  animation-duration: 28s;
  animation-delay: 2s;
}
.p4 {
  top: 40%;
  left: 70%;
  animation-duration: 18s;
  animation-delay: 3s;
}
.p5 {
  top: 65%;
  left: 40%;
  animation-duration: 24s;
  animation-delay: 4s;
}
.p6 {
  top: 80%;
  left: 80%;
  animation-duration: 20s;
  animation-delay: 5s;
}
.p7 {
  top: 50%;
  left: 30%;
  animation-duration: 26s;
  animation-delay: 6s;
}
.p8 {
  top: 20%;
  left: 50%;
  animation-duration: 23s;
  animation-delay: 7s;
}
.p9 {
  top: 90%;
  left: 60%;
  animation-duration: 19s;
  animation-delay: 8s;
}
.p10 {
  top: 35%;
  left: 10%;
  animation-duration: 27s;
  animation-delay: 9s;
}
.p11 {
  top: 60%;
  left: 90%;
  animation-duration: 21s;
  animation-delay: 10s;
}
.p12 {
  top: 15%;
  left: 65%;
  animation-duration: 29s;
  animation-delay: 11s;
}

/* 登录卡片样式 */
.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(15, 25, 40, 0.9);
  border-radius: 10px;
  border: 1px solid rgba(32, 160, 255, 0.3);
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(32, 160, 255, 0.2),
    inset 0 0 15px rgba(32, 160, 255, 0.05);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
  overflow: hidden;
}

/* 卡片装饰元素 */
.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 1;
}

.top-left {
  top: 0;
  left: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.7);
  border-left: 2px solid rgba(64, 169, 255, 0.7);
}

.top-right {
  top: 0;
  right: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.7);
  border-right: 2px solid rgba(64, 169, 255, 0.7);
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.7);
  border-left: 2px solid rgba(64, 169, 255, 0.7);
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.7);
  border-right: 2px solid rgba(64, 169, 255, 0.7);
}

/* 标题样式 */
.login-title {
  text-align: center;
  margin-bottom: 15px;
  color: rgba(220, 240, 255, 0.9);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(64, 169, 255, 0.5);
  position: relative;
}

.title-underline {
  width: 70%;
  height: 1px;
  margin: 0 auto 25px;
  background: linear-gradient(to right, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.7) 50%, rgba(32, 160, 255, 0));
  position: relative;
}

.title-underline::after {
  content: '';
  position: absolute;
  width: 40%;
  height: 1px;
  left: 30%;
  bottom: -3px;
  background: rgba(64, 169, 255, 0.5);
  filter: blur(1px);
}

.login-type-switch {
  display: flex;
  justify-content: space-around;
  margin-bottom: 25px;
  padding: 5px;
  background: transparent;
  border: none;
}

.switch-btn {
  margin: 0 5px;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: rgba(20, 40, 70, 0.4) !important;
  border: 1px solid rgba(32, 160, 255, 0.3) !important;
  color: rgba(180, 220, 250, 0.8) !important;
}

.switch-btn.active {
  background: rgba(32, 160, 255, 0.2) !important;
  border-color: rgba(64, 169, 255, 0.5) !important;
  color: rgba(220, 240, 255, 1) !important;
  box-shadow: 0 0 10px rgba(32, 160, 255, 0.2) !important;
}

:deep(.styled-input) {
  background: rgba(20, 40, 70, 0.5) !important;
  border: 1px solid rgba(32, 160, 255, 0.3) !important;
  border-radius: 6px !important;
  color: rgba(220, 240, 255, 0.9) !important;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s ease !important;
}

:deep(.styled-input:hover),
:deep(.styled-input:focus) {
  border-color: rgba(64, 169, 255, 0.7) !important;
  box-shadow:
    0 0 15px rgba(32, 160, 255, 0.25),
    inset 0 0 5px rgba(0, 0, 0, 0.2) !important;
}

:deep(.styled-input input::placeholder),
:deep(.styled-input .ant-input::placeholder) {
  color: rgba(130, 180, 220, 0.7) !important;
  opacity: 1 !important;
}

:deep(.styled-input input),
:deep(.styled-input .ant-input) {
  background: transparent !important;
  color: rgba(220, 240, 255, 0.95) !important;
}

:deep(.styled-input .ant-input-prefix) {
  color: rgba(80, 180, 255, 0.9) !important;
  margin-right: 10px !important;
  font-size: 16px !important;
}

.login-button {
  position: relative;
  height: 48px;
  background: linear-gradient(135deg, #1890ff, #40a9ff, #1890ff) !important;
  background-size: 200% 100% !important;
  border: none !important;
  border-radius: 6px !important;
  overflow: hidden;
  box-shadow:
    0 4px 15px rgba(24, 144, 255, 0.3),
    0 0 0 1px rgba(32, 160, 255, 0.5) inset !important;
  animation: buttonGradient 3s ease infinite !important;
  transition: all 0.3s ease !important;
}

.login-button:hover {
  transform: translateY(-2px);
  background-size: 200% 100% !important;
  box-shadow:
    0 6px 20px rgba(24, 144, 255, 0.5),
    0 0 0 1px rgba(64, 169, 255, 0.7) inset,
    0 0 20px rgba(32, 160, 255, 0.3) !important;
  animation: buttonGradientFast 2s ease infinite !important;
}

.login-button:active {
  transform: translateY(1px);
  box-shadow:
    0 2px 10px rgba(24, 144, 255, 0.3),
    0 0 0 1px rgba(64, 169, 255, 0.7) inset !important;
}

.btn-text {
  position: relative;
  z-index: 2;
  font-weight: 600;
  letter-spacing: 1.5px;
  font-size: 16px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: shine 3s infinite;
  z-index: 1;
}

.login-button::before,
.login-button::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 2;
  pointer-events: none;
}

.login-button::before {
  top: 0;
  left: 0;
  border-top: 2px solid rgba(255, 255, 255, 0.7);
  border-left: 2px solid rgba(255, 255, 255, 0.7);
  border-top-left-radius: 5px;
}

.login-button::after {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid rgba(255, 255, 255, 0.7);
  border-right: 2px solid rgba(255, 255, 255, 0.7);
  border-bottom-right-radius: 5px;
}

/* 按钮渐变动画 */
@keyframes buttonGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes buttonGradientFast {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes pulsate {
  0% {
    opacity: 0.5;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.7;
    transform: scale(1);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.9);
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(10px, 10px);
  }
  50% {
    transform: translate(15px, -5px);
  }
  75% {
    transform: translate(-5px, 10px);
  }
  100% {
    transform: translate(0, 0);
  }
}

/* 响应式调整 */
@media (max-width: 500px) {
  .login-card {
    width: 90%;
    padding: 30px 20px;
  }

  .login-title {
    font-size: 22px;
  }
}
</style>
