import { Router, RouteDef, Route as RuntimeRoute } from 'util/router'

import appRoute from 'view/app'

const snabbdomModules = [
  require('snabbdom/modules/class').default,
  require('snabbdom/modules/props').default,
  require('snabbdom/modules/style').default,
  require('snabbdom/modules/attributes').default
]

const app = appRoute()

const router = Router({
  routes: { app },
  elm: document.querySelector('#screenLayer')!,
  snabbdomModules,
  notFound: app.notFound
})

export const routes = router.routes.app

type Route<P> = RuntimeRoute<P, {}>

export { RouteDef, Route, Router }

export const transitionTo = router.transitionTo
export const replaceParams = router.replaceParams
export const previous = router.previous
export const link = router.link
router.init()
