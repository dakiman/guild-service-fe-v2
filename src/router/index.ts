import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { applyAuthGuard } from './guards'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/pages/ResetPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/characters',
    name: 'character-search',
    component: () => import('@/pages/CharacterSearchPage.vue'),
  },
  {
    path: '/characters/:region/:realm/:name',
    name: 'character-detail',
    component: () => import('@/pages/CharacterDetailPage.vue'),
    props: true,
  },
  {
    path: '/guilds',
    name: 'guild-search',
    component: () => import('@/pages/GuildSearchPage.vue'),
  },
  {
    path: '/guilds/:region/:realm/:name',
    name: 'guild-detail',
    component: () => import('@/pages/GuildDetailPage.vue'),
    props: true,
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/blizzard-oauth',
    name: 'blizzard-oauth',
    component: () => import('@/pages/BlizzardOAuthCallbackPage.vue'),
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

applyAuthGuard(router)
