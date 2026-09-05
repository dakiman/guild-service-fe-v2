import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { applyAuthGuard } from './guards'
import { scrollBehavior } from './scrollBehavior'
import { installDocumentTitle } from './documentTitle'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    dynamicTitle?: boolean
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guestOnly: true, title: 'Sign in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guestOnly: true, title: 'Create account' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/ForgotPasswordPage.vue'),
    meta: { guestOnly: true, title: 'Forgot password' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/pages/ResetPasswordPage.vue'),
    meta: { guestOnly: true, title: 'Reset password' },
  },
  {
    path: '/characters',
    name: 'character-search',
    component: () => import('@/pages/CharacterSearchPage.vue'),
    meta: { title: 'Characters' },
  },
  {
    path: '/mythic-plus',
    name: 'mythic-plus',
    component: () => import('@/pages/MythicPlusPage.vue'),
    meta: { title: 'Mythic+' },
  },
  {
    path: '/mythic-plus/seasons/:slug',
    name: 'mythic-plus-archive',
    component: () => import('@/pages/MythicPlusArchivePage.vue'),
    props: true,
    meta: { title: 'Mythic+ archive' },
  },
  {
    path: '/raids',
    name: 'raids',
    component: () => import('@/pages/RaidsPage.vue'),
    meta: { title: 'Raids' },
  },
  {
    path: '/leaderboards',
    name: 'leaderboards',
    redirect: { name: 'leaderboards-region', params: { region: 'eu' } },
  },
  { path: '/leaderboards/world', name: 'leaderboards-world', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:region(eu|us)', name: 'leaderboards-region', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:region(eu|us)/realm/:realm', name: 'leaderboards-realm', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:region(eu|us)/class/:classSlug', name: 'leaderboards-class', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:region(eu|us)/spec/:specSlug', name: 'leaderboards-spec', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  // Season-prefixed ladders (frozen standings; the season-less routes above are the current season).
  { path: '/leaderboards/:season([a-z]+-\\d+)/world', name: 'leaderboards-season-world', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)', name: 'leaderboards-season-region', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/realm/:realm', name: 'leaderboards-season-realm', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/class/:classSlug', name: 'leaderboards-season-class', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/spec/:specSlug', name: 'leaderboards-season-spec', component: () => import('@/pages/LeaderboardsPage.vue'), meta: { title: 'Leaderboards' } },
  {
    path: '/characters/:region/:realm/:name',
    name: 'character-detail',
    component: () => import('@/pages/CharacterDetailLayout.vue'),
    props: true,
    meta: { dynamicTitle: true },
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
        path: 'dungeons',
        name: 'character-dungeons',
        component: () => import('@/pages/character/CharacterDungeonsTab.vue'),
      },
      {
        path: 'raids',
        name: 'character-raids',
        component: () => import('@/pages/character/CharacterRaidsTab.vue'),
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
    meta: { title: 'Guilds' },
  },
  {
    path: '/guilds/:region/:realm/:name',
    name: 'guild-detail',
    component: () => import('@/pages/GuildDetailPage.vue'),
    props: true,
    meta: { dynamicTitle: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true, title: 'Profile' },
  },
  {
    path: '/blizzard-oauth',
    name: 'blizzard-oauth',
    component: () => import('@/pages/BlizzardOAuthCallbackPage.vue'),
    meta: { requiresAuth: true, title: 'Battle.net' },
  },
  {
    path: '/meta',
    name: 'meta',
    component: () => import('@/pages/MetaPage.vue'),
    meta: { title: 'M+ Meta' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/AboutPage.vue'),
    meta: { title: 'About' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Page not found' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
})

applyAuthGuard(router)
installDocumentTitle(router)
