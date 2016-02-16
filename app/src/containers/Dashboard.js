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
}

function createComponents(services) {
  return window.services.map(function(s) {
    return React.createElement(widgetToComponent(s.widget), {id: s.id, key: s.id})
  })
}

function widgetToComponent(widget) {
  switch (widget) {
    case 'invoices':
      return Invoices;
    case 'payments':
      return Payments;
  }
}

export default Dashboard
