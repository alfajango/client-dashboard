import React from 'react'
import { createStore } from 'redux'
import rootReducer from './reducers'
import {receiveData, receiveError, receiveStatus} from './actions'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import Dashboard from './containers/Dashboard'
import {IntlProvider} from 'react-intl';
const store = createStore(rootReducer);

socket.on('serviceResponse', function(response) {
  if (response.errors) {
    store.dispatch(receiveError(response));
  } else if (response.status) {
    store.dispatch(receiveStatus(response));
  } else {
    store.dispatch(receiveData(response));
  }
});

render(
  <Provider store={store}>
    <IntlProvider locale="en">
      <Dashboard locales={['en-US']} />
    </IntlProvider>
  </Provider>,
  document.getElementById('dashboard')
);