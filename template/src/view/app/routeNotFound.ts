import { h } from 'kaiju'
import { RouteDef } from 'router'


export default function route() {
  return RouteDef('notFound', {}, {
    enter: () => () => h('h1', { key: 'notFound' }, '404 :-('),
    children: {}
  })
}