import { combineReducers } from 'redux'
import {
  INVALIDATE_DATA, REQUEST_DATA, RECEIVE_DATA, RECEIVE_STATUS, RECEIVE_ERROR
} from './actions'

function data(state = {
  isFetching: true,
  didInvalidate: false,
  status: 'Loading',
  data: []
}, action) {
  switch (action.type) {
    case INVALIDATE_DATA:
      return Object.assign({}, state, {
        didInvalidate: true
      });
    case REQUEST_DATA:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });
    case RECEIVE_ERROR:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        status: action.error,
        lastUpdated: action.receivedAt
      });
    case RECEIVE_STATUS:
      return Object.assign({}, state, {
        status: action.status,
        lastUpdated: action.receivedAt
      });
    case RECEIVE_DATA:
      return Object.assign({}, state.data, {
        isFetching: false,
        didInvalidate: false,
        status: '',
        data: action.data,
        lastUpdated: action.receivedAt
      });
    default:
      return state
  }
}

function dataByService(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_DATA:
    case REQUEST_DATA:
    case RECEIVE_DATA:
    case RECEIVE_STATUS:
      return Object.assign({}, state, {
        [action.serviceId]: data(state[action.serviceId], action)
      });
    default:
      return state
  }
}

const rootReducer = combineReducers({
  dataByService
});

export default rootReducer
