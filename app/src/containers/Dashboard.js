import React, { Component } from 'react'
import { WidthProvider, Responsive } from 'react-grid-layout'
import Invoices from '../../widgets/invoices/widget'
import Payments from '../../widgets/payments/widget'
const GridLayout = WidthProvider(Responsive);

var Dashboard = React.createClass({
  createComponents() {
    return window.services.map(function(s) {
      return React.createElement('div', {key: s.id},
        React.createElement(widgetToComponent(s.widget), {id: s.id}))
    })
  },

  render() {
    var layouts = {
      lg: window.services.map(function(s, i) {
        return {x: i % 2, y: 0, w: 1, h: 1, i: s.id}
      })
    };

    return (
      <GridLayout className="layout" layouts={layouts} breakpoints={{lg: 0}} cols={{lg: 2}} rowHeight={500}>
        {this.createComponents()}
      </GridLayout>
    )
  }
});

function widgetToComponent(widget) {
  switch (widget) {
    case 'invoices':
      return Invoices;
    case 'payments':
      return Payments;
  }
}

export default Dashboard
