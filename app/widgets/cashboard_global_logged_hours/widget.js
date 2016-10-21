import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import 'style!react-select/scss/default.scss'
import { invalidateData } from '../../src/actions'

const ReactHighcharts = require( 'react-highcharts' );

const config = {
  /* HighchartsConfig */
};

var Widget = React.createClass({
  selectClient(client) {
    if (client) {
      this.props.selectClient(this.props.name, this.props.id, client.value);
    } else {
      this.props.clearClient(this.props.id, {client: this.props.data.client});
    }
  },

  render() {
    const { data, status, isFetching, didInvalidate } = this.props;
    return (
      <div>
        <h2>Logged Hours</h2>
        <ReactHighcharts config={config}/>
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
  debugger
  return {
    isFetching,
    didInvalidate,
    status,
    data,
    id
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Widget)
