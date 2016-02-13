import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import InvoiceList from '../../src/components/InvoiceList'
import PaymentList from '../../src/components/PaymentList'

class Widget extends Component {
  render() {
    const { invoices, payments, isFetching } = this.props
    return (
      <div>
        {isFetching &&
        <h2>Loading...</h2>
        }
        {!isFetching &&
        <InvoiceList>{invoices}</InvoiceList>
        }
        {!isFetching &&
        <PaymentList>{payments}</PaymentList>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  invoices: PropTypes.array,
  payments: PropTypes.array
}

function mapStateToProps(state, ownProps) {
  const { dataByService } = state
  const {
    isFetching,
    invoices,
    payments
    } = dataByService[ownProps.id] || {
    isFetching: true,
    invoices: [],
    payments: []
  }

  return {
    isFetching,
    invoices,
    payments
  }
}

export default connect(mapStateToProps)(Widget)
