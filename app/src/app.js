import React from 'react'
import { createStore, compose, applyMiddleware } from 'redux'
import rootReducer from './reducers'
import {receiveData, receiveError, receiveStatus} from './actions'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import Dashboard from './containers/Dashboard'
import {IntlProvider} from 'react-intl';
import thunk from 'redux-thunk';
import widgetMap from './manifest'
const store = createStore(rootReducer, {}, compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

socket.on('serviceResponse', function(response) {
  console.info(response);
  if (widgetMap[response.serviceName]) {
    if (response.errors) {
      store.dispatch(receiveError(response));
    } else if (response.status) {
      store.dispatch(receiveStatus(response));
    } else {
      store.dispatch(receiveData(response));
    }
  }
});

render(
  <Provider store={store}>
    <IntlProvider locale="en">
      <Dashboard />
    </IntlProvider>
  </Provider>,
  document.getElementById('dashboard')
);
