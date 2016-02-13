import { combineReducers } from 'redux'
import {
  INVALIDATE_INVOICES, RECEIVE_DATA, REQUEST_DATA
} from './actions'

function data(state = {
  isFetching: true,
  didInvalidate: false,
  invoices: [],
  payments: []
}, action) {
  switch (action.type) {
    case INVALIDATE_INVOICES:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case REQUEST_DATA:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case RECEIVE_DATA:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        invoices: action.data.filter(i => i.type == 'invoice'),
        payments: action.data.filter(i => i.type == 'payment'),
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function dataByService(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_INVOICES:
    case REQUEST_DATA:
    case RECEIVE_DATA:
      return Object.assign({}, state, {
        [action.serviceId]: data(state[action.serviceId], action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  dataByService
})

export default rootReducer
