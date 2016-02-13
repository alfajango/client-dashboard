import React from 'react'
import { createStore } from 'redux'
import App from './reducers'
import {receiveData} from './actions'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import InvoiceList from './components/InvoiceList'
let store = createStore(App)

socket.on('serviceResponse', function(response) {
  console.log(response)
  store.dispatch(receiveData(response));
});

// Change the InvoiceList id to your serviceId
render(
  <Provider store={store}>
    <InvoiceList id="56b4cfbf1d912fe06e27a28c" />
  </Provider>,
  document.getElementById('react-demo-container')
)
