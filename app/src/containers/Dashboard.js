import React, { Component } from 'react'
import Invoices from '../../widgets/invoices/widget'
import Payments from '../../widgets/payments/widget'

class Dashboard extends Component {
  render() {
    return (
      <div>
        {createComponents()}
      </div>
    )
  }
};

function widgetToComponent(widget) {
  switch (widget) {
    case 'invoices':
      return Invoices;
    case 'payments':
      return Payments;
  }
}

function createComponents() {
  var components = []
  window.services.forEach(function(s) {
    var component = widgetToComponent(s.widget);
    if (component) {
      components.push(React.createElement(widgetToComponent(s.widget), {id: s.id, key: s.id}))
    }
  })
  return components;
}

export default Dashboard
