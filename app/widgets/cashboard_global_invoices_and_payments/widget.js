import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Select from 'react-select'
import 'style-loader!react-select/scss/default.scss'
import { selectClient } from './actions'
import { invalidateData } from '../../src/actions'
import InvoiceList from '../../src/components/InvoiceList'
import PaymentList from '../../src/components/PaymentList'

class Widget extends Component {
  selectClient(client) {
    if (client) {
      this.props.selectClient(this.props.name, this.props.id, client.value);
    } else {
      this.props.clearClient(this.props.id, {client: this.props.data.client});
    }
  }

  render() {
    const { data, status, isFetching, didInvalidate } = this.props;
    return (
      <div>
        <h2>Invoices and Payments</h2>
        {data.client &&
        <Select
          autofocus
          value={data.clientId}
          options={data['client'].map(i => ({value:i.id,label:i.attributes.name}))}
          onChange={this.selectClient.bind(this)}
          isLoading={!data.client}
          style={{ marginBottom: 14 }}
        />
        }
        {!didInvalidate && data.clientId &&
        <div>
          <h3>Invoices</h3>
          {data.invoice &&
            <InvoiceList>{data.invoice}</InvoiceList>
          }
          {!data.invoice &&
          React.createElement('div', {className: 'loading large'},
            'Loading invoices ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
          }
          <h3>Payments</h3>
          {data.payment &&
          <PaymentList>{data.payment}</PaymentList>
          }
          {!data.payment &&
          React.createElement('div', {className: 'loading large'},
            'Loading payments ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
          }
        </div>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.object,
  selectClient: PropTypes.func
};

const mapDispatchToProps = (dispatch) => {
  return {
    selectClient: (serviceName, serviceId, clientId) => {
      dispatch(selectClient(serviceName, serviceId, {clientId, invoice: null, payment: null}));
    },
    clearClient: (serviceId) => {
      dispatch(invalidateData(serviceId, {clientId: null}));
    }
  }
};

const mapStateToProps = (state, ownProps) => {
  const id = ownProps.id;

  const {
    isFetching,
    didInvalidate,
    status,
    data
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    didInvalidate: false,
    status: 'Loading',
    data: {
      clientId: ''
    }
  };
  if (didInvalidate) {
    data.clientId = '';
  }

  return {
    isFetching,
    didInvalidate,
    status,
    data,
    id
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Widget)
