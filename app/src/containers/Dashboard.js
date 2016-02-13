import React, { Component } from 'react'
import InvoicesPayments from '../../widgets/invoices_and_payments/widget'

class Dashboard extends Component {
  render() {
    return (
      <div>
        <h1>Invoices and Payments</h1>
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
    case 'invoices_and_payments':
      return InvoicesPayments
  }
}

export default Dashboard
