import { update } from 'space-lift'
import { Message } from 'kaiju'
import Store, { Store as StoreType } from 'kaiju/store'


export const incrementCounter = Message('incrementCounter')

export interface State {
  count: number
}

const initState: State = {
  count: 0
}

export type AppStore = StoreType<State>

export default Store(initState, on => {

  on(incrementCounter, state => {
    const count = state.count
    return update(state, { count: count + 1 })
  })

}, { name: 'appStore' })
