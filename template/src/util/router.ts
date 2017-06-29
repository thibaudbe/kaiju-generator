/* tslint:disable:no-any */

import { Router as AbyssaRouter, RouterAPI, State, ParamsDiff, StateWithParams } from 'abyssa'
import { h, startApp, VNode, Render } from 'kaiju'
import lift from 'space-lift'


/* More typesafe abstraction using abyssa */


/* A static route definition */
export type RouteDef<P, Children extends RouteMap> = {
  // The main data is 'hidden' in def so as to not polute the namespace and have nice children state autocomplete
  def: {
    uri: string
    fullName: string
    parent: RouteDef<{}, {}> | undefined
  } & RouteDefOptions<P, Children>
  params: P // The value is never used, it's only here to read the params type
} & Children

interface RouteDefOptions<P, Children extends RouteMap> {
  children: Children
  enter: (router: Router, initRoute: Route<P, Children>) => (route: Route<P, Children>, child: VNode) => VNode
  update?: (route: CurrentRoute<P, Children>) => void
  exit?: () => void
}

type RouteMap = Record<string, RouteDef<{}, {}>>

/* A materialized route at runtime, complete with the actual parsed params */
export interface Route<P, Children extends RouteMap> {

  /* A reference to the matching route definition */
  route: RouteDef<P, Children>

  /* The parsed params at runtime */
  params: P

  /* Determines whether a runtime Route matches a Route definition */
  is(def: RouteDef<{}, {}>): boolean

  /* Determines whether this route is included in or matches a Route definition */
  isIn(def: RouteDef<{}, {}>): boolean
}

export interface CurrentRoute<P, Children extends RouteMap> extends Route<P, Children> {
  paramsDiff: ParamsDiff
}

/* Creates a new Route definition */
export function RouteDef<P, Children extends RouteMap>(
  uri: string,
  _params: P,
  options: RouteDefOptions<P, Children>,
) {

  const children = options.children || {}

  return Object.assign({
    def: {
      uri,
      fullName: undefined!,
      parent: undefined!,
      ...options
    },
    params: undefined!
  }, children)
}

// The public interface to be used for the Router.
export interface Router {
  routes: RouteMap

  init(): void
  transitionTo<P>(route: RouteDef<P, {}>, params: P): void
  replaceParams(params: {}): void
  link<P>(route: RouteDef<P, {}>, params: P): string
}

interface TypedRouter<Routes> {
  routes: Routes

  init(): void
  transitionTo<P>(route: RouteDef<P, {}>, params: P): void
  replaceParams(params: {}): void
  previous(): StateWithParams | void
  link<P>(route: RouteDef<P, {}>, params: P): string
}

type RouterOptions<Routes extends RouteMap> = {
  routes: Routes
  elm: Element
  replaceElm?: boolean
  snabbdomModules: Array<{}>

  enableLogs?: boolean
  interceptAnchors?: boolean
  urlSync?: 'history' | 'hash'
  hashPrefix?: string
  notFound?: RouteDef<{}, {}>
}

/* Creates the router and starts the application */
export function Router<Routes extends RouteMap>(options: RouterOptions<Routes>): TypedRouter<Routes> {

  // The lookup of our custom route objects by full name
  const routeByName: Record<string, RouteDef<{}, {}>> = {}

  // The components currently mounted, top-down
  const components: Array<(route: Route<{}, {}>, child: VNode) => VNode> = []

  // The current route in the transition
  let currentRoute: CurrentRoute<{}, {}> | undefined

  // The current app VNode
  let currentVNode: VNode | undefined

  let typedRouter: TypedRouter<Routes>

  // Translate our RouteDefs into abyssa States
  function transformRouteTree(
    name: string,
    route: RouteDef<{}, {}>,
    parent: RouteDef<{}, {}> | undefined = undefined
  ): State {

    routeByName[name] = route

    route.def.parent = parent
    route.def.fullName = name

    const children = route.def.children
      ? lift(route.def.children)
          .mapValues((childName, childRoute) => transformRouteTree(`${name}.${childName}`, childRoute, route))
          .value()
      : {}

    return State(route.def.uri, {
      enter: () => {
        components.push(
          route.def.enter(typedRouter, currentRoute!))
      },
      update: () => {
        if (route.def.update)
          route.def.update(currentRoute!)
      },
      exit: () => {
        components.pop()
        if (route.def.exit)
          route.def.exit()
      }
    }, children)
  }


  const rootStates = lift(options.routes).mapValues(transformRouteTree).value()
  const router = AbyssaRouter(rootStates)

  const abyssaOptions = Object.assign({}, options, {
    notFound: options.notFound && options.notFound.def.fullName
  })

  router.configure(abyssaOptions)

  router.on('started', newState => {
    const routeDef = routeByName[newState.fullName]
    currentRoute = makeRoute(routeDef, newState.params, newState.paramsDiff)
  })

  router.on('ended', () => {
    const newAppNode = components.reduceRight((previous, current) => {
      return current(currentRoute!, previous)
    }, emptyVNode)

    if (currentVNode) {
      Render.into(currentVNode, newAppNode)
    }
    else {
      startApp({
        app: newAppNode,
        elm: options.elm,
        replaceElm: options.replaceElm,
        snabbdomModules: options.snabbdomModules
      })
    }

    currentVNode = newAppNode
  })

  const routerApi = router as {} as RouterAPI

  function transitionTo<P>(route: RouteDef<P, {}>, params: P) {
    return routerApi.transitionTo(route.def.fullName, params)
  }

  function link<P>(route: RouteDef<P, {}>, params: P) {
    return routerApi.link(route.def.fullName, params)
  }

  function replaceParams(params: {}) {
    return routerApi.replaceParams(params)
  }

  function init() {
    router.init()
  }

  typedRouter = {
    routes: options.routes,
    transitionTo,
    replaceParams,
    link,
    previous: routerApi.previous,
    init
  }

  return typedRouter
}


function makeRoute(route: RouteDef<{}, {}>, params: {}, paramsDiff: ParamsDiff) {
  return {
    route,
    params,
    paramsDiff,
    is: (otherRoute: RouteDef<{}, {}>) => route.def.fullName === otherRoute.def.fullName,
    isIn: (parentRoute: RouteDef<{}, {}>) => {
      let parent = route
      while (parent) {
        if (parent === parentRoute) return true
        parent = parent.def.parent!
      }
      return false
    }
  }
}

const emptyVNode = h('div', { key: '_emptyVNode' })