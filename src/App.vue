<script setup lang="ts">
import AppHeader from './components/layouts/AppHeader.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isLoginPage = () => route.path === '/login';
</script>

<template>
  <div class="app-container">
    <AppHeader v-if="!isLoginPage()" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* 全局样式已移至 assets/styles/main.css */
</style>
