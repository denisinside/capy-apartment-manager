import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/profile',
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
    },
    {
      path: '/apartment/:id',
      name: 'apartment-details',
      component: () => import('../views/ApartmentDetailsView.vue')
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('../views/SearchResultView.vue'),
    },
    {
      path: '/favourites',
      name: 'favourites',
      component: () => import('../views/FavouritesView.vue'),
    },
    {
      path: '/safety',
      name: 'safety',
      component: () => import('../views/SafetyView.vue'),
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: () => import('../views/ContractsView.vue'),
    },
    {
      path: '/rieltor/:name',
      name: 'rieltor',
      component: () => import('../views/RieltorView.vue'),
    },
    {
      path: '/agency/:name',
      name: 'agency',
      component: () => import('../views/AgencyView.vue'),
    },
    {
      path: '/new',
      name: 'NewApartments',
      component: () => import('../views/NewApartments.vue'),
    },
    {
      path: '/subscription-settings',
      name: 'SubscriptionSettings',
      component: () => import('../views/SubscriptionSettings.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.path.startsWith('//')) {
    const correctedPath = to.path.replace(/^\/+/, '/')
    next({
      path: correctedPath,
      query: to.query,
      hash: to.hash,
      replace: true
    })
  } else {
    next()
  }
})

export default router
