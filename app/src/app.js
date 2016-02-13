import React from 'react'
import { createStore } from 'redux'
import App from './reducers'
import {receiveData} from './actions'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import Dashboard from './containers/Dashboard'
let store = createStore(App)

socket.on('serviceResponse', function(response) {
  console.log(response)
  store.dispatch(receiveData(response));
});

render(
  <Provider store={store}>
    <Dashboard />
  </Provider>,
  document.getElementById('dashboard')
)
