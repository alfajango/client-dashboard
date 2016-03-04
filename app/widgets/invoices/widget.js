import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import InvoiceList from '../../src/components/InvoiceList'

class Widget extends Component {
  render() {
    const { data, status, isFetching } = this.props;
    return (
      <div>
        <h2>Invoices</h2>
        {isFetching &&
          React.createElement('div', {className: 'loading large'},
            status,
            ' ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
        }
        {!isFetching &&
        <InvoiceList>{data}</InvoiceList>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.array
};

function mapStateToProps(state, ownProps) {
  const {
    isFetching,
    status,
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    status: 'Loading'
  };
  var data = [];
  if (state.dataByService[ownProps.id]) {
    data = state.dataByService[ownProps.id].data.invoice
  }

  return {
    isFetching,
    status,
    data
  }
}

export default connect(mapStateToProps)(Widget)
