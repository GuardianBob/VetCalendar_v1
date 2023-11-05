
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/Schedule.vue') ,
        alias: [
          '/:year*', 
          '/:year*/:month*', 
          '/:year*/:month*/:user*'
        ],
      },
      { path: '/schedule_import', redirect: '/', 
        alias: [
          '/schedule_import/:year*', 
          '/schedule_import/:year*/:month*', 
          '/schedule_import/:year*/:month*/:user*'
        ],  
    },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
