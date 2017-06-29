import { h } from 'kaiju'
import { RouteDef } from 'router'


export default function route() {
  return RouteDef('', {}, {
    enter: () => () => {
      return h('div', [
        h('h1', 'Index'),
        h('span', 'Index Page')
      ])
    },
    children: {}
  })
}
