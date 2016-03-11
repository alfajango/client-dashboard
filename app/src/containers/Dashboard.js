import React, { Component } from 'react'
import widgetMap from '../manifest'

class Dashboard extends Component {
  render() {
    return (
      <div>
        {createComponents()}
      </div>
    )
  }
}

function createComponents() {
  var components = [];
  window.services.forEach(function(s) {
    var component = widgetMap[s.widget];
    if (component) {
      components.push(React.createElement(widgetMap[s.widget], {id: s.id, key: s.id, name: s.widget}))
    }
  });
  return components;
}

export default Dashboard
