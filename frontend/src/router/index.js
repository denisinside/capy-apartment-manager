import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../views/ListView.vue'),
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

export default router
