import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import 'style!react-select/scss/default.scss'
import { selectClient } from './actions'

var Widget = React.createClass({
  getInitialState() {
    return {
      selectValue: ""
    }
  },

  selectClient(client) {
    this.props.selectClient(this.props.name, this.props.id, client.value);
  },

  render() {
    const { data, status, isFetching } = this.props;

    return (
      <div>
        <h2>Invoices and Payments</h2>
        {isFetching &&
        React.createElement('div', {className: 'loading large'},
          status,
          ' ',
          React.createElement('img', {src: '/images/ajax-loader.gif'}))
        }
        {!isFetching &&
        <Select
          autofocus
          value={this.state.selectValue}
          options={data['client'].map(i => ({value:i.id,label:i.attributes.name}))}
          onChange={this.selectClient}
        />
        }
      </div>
    )
  }
});

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.array,
  selectClient: PropTypes.func
};

const mapDispatchToProps = (dispatch) => {
  return {
    selectClient: (serviceName, serviceId, clientId) => {
      dispatch(selectClient(serviceName, serviceId, clientId));
    }
  }
};

const mapStateToProps = (state, ownProps) => {
  const {
    isFetching,
    status
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    status: 'Loading'
  };
  const id = ownProps.id;
  const data = {};
  if (state.dataByService[ownProps.id]) {
    state.dataByService[ownProps.id].data.forEach(function(i) {
      if (!data.hasOwnProperty(i.type)) data[i.type] = [];
      data[i.type].push(i);
    });
  }

  return {
    isFetching,
    status,
    data,
    id
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Widget)
