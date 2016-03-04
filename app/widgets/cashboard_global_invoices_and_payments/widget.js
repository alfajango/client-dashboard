import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import 'style!react-select/scss/default.scss'
import { selectClient } from './actions'
import InvoiceList from '../../src/components/InvoiceList'
import PaymentList from '../../src/components/PaymentList'

var Widget = React.createClass({
  getInitialState() {
    // TODO: track these in state
    return {
      clientId: ""
    }
  },

  selectClient(client) {
    this.state.clientId = client.value;
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
          value={this.state.clientId}
          options={data['client'].map(i => ({value:i.id,label:i.attributes.name}))}
          onChange={this.selectClient}
        />
        }
        {this.state.clientId && data.invoice &&
        <InvoiceList>{data['invoice']}</InvoiceList>
        }
        {this.state.clientId && data.payment &&
        <PaymentList>{data['payment']}</PaymentList>
        }
      </div>
    )
  }
});

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.object,
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
  const id = ownProps.id;

  const {
    isFetching,
    status,
    data
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    status: 'Loading',
    data: {}
  };

  return {
    isFetching,
    status,
    data,
    id
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Widget)
