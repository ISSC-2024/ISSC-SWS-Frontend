<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Form, Input, Button, message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import AuthService from '../services/AuthService';

const router = useRouter();
const formRef = ref();
const loading = ref(false);

// 表单状态
const formState = reactive({
  username: '',
  password: '',
});

// 表单校验规则
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }] as Rule[],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }] as Rule[],
};

// 登录处理
const handleLogin = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;
    
    // 使用认证服务进行登录验证
    const authResult = await AuthService.login({
      username: formState.username,
      password: formState.password
    });
    
    if (authResult.success) {
      // 显示成功消息
      message.success(authResult.message);
      
      // 跳转到仪表盘页面
      setTimeout(() => {
        router.push('/dashboard');
        loading.value = false;
      }, 1000);
    } else {
      // 显示错误消息
      message.error(authResult.message);
      loading.value = false;
    }
  } catch (error: any) {
    console.log('表单验证失败:', error);
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">安全风险智能预警决策</h1>
      <Form
        layout="vertical"
        :model="formState"
        :rules="rules"
        ref="formRef"
        class="login-form"
      >
        <Form.Item name="username">
          <Input
            v-model:value="formState.username"
            size="large"
            placeholder="用户名"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </Input>
        </Form.Item>
        
        <Form.Item name="password">
          <Input.Password
            v-model:value="formState.password"
            size="large"
            placeholder="密码"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </Input.Password>
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            size="large" 
            block 
            @click="handleLogin"
            :loading="loading"
          >
            登录
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e6eef5 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background-color: var(--panel-background);
  border-radius: 8px;
  box-shadow: var(--panel-shadow);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--primary-color);
  font-size: 24px;
}

.login-form {
  width: 100%;
}
</style> 