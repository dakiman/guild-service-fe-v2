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
    component: () => import('@/pages/CharacterDetailLayout.vue'),
    props: true,
    redirect: (to) => ({
      name: 'character-summary',
      params: {
        region: to.params.region,
        realm: to.params.realm,
        name: to.params.name,
      },
    }),
    children: [
      {
        path: 'summary',
        name: 'character-summary',
        component: () => import('@/pages/character/CharacterSummaryTab.vue'),
      },
      {
        path: 'talents',
        name: 'character-talents',
        component: () => import('@/pages/character/CharacterTalentsTab.vue'),
      },
      {
        path: 'titles',
        name: 'character-titles',
        component: () => import('@/pages/character/CharacterTitlesTab.vue'),
      },
      {
        path: 'collections',
        name: 'character-collections',
        component: () => import('@/pages/character/CharacterCollectionsTab.vue'),
        redirect: (to) => ({
          name: 'character-collections-mounts',
          params: {
            region: to.params.region,
            realm: to.params.realm,
            name: to.params.name,
          },
        }),
        children: [
          {
            path: 'mounts',
            name: 'character-collections-mounts',
            component: () => import('@/pages/character/collections/MountsSubtab.vue'),
          },
          {
            path: 'pets',
            name: 'character-collections-pets',
            component: () => import('@/pages/character/collections/PetsSubtab.vue'),
          },
          {
            path: 'toys',
            name: 'character-collections-toys',
            component: () => import('@/pages/character/collections/ToysSubtab.vue'),
          },
        ],
      },
      {
        path: 'pve',
        name: 'character-pve',
        component: () => import('@/pages/character/CharacterPveTab.vue'),
      },
      {
        path: 'reputations',
        name: 'character-reputations',
        component: () => import('@/pages/character/CharacterReputationsTab.vue'),
      },
      {
        path: 'achievements',
        name: 'character-achievements',
        component: () => import('@/pages/character/CharacterAchievementsTab.vue'),
      },
    ],
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
