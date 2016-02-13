import React, { PropTypes, Component } from 'react'
import Invoice from './Invoice'
import { connect } from 'react-redux'
import { receiveData } from '../actions'

const InvoiceList = ({ isFetching, invoices }) => (
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Due</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {invoices.map(function(invoice) {
        return <Invoice key={invoice.id}>{invoice}</Invoice>;
      })}
    </tbody>
  </table>
)

function mapStateToProps(state, ownProps) {
  const { dataByService } = state
  const {
    isFetching,
    invoices: invoices
    } = dataByService[ownProps.id] || {
    isFetching: true,
    invoices: []
  }

  return {
    isFetching,
    invoices
  }
}

InvoiceList.propTypes = {
  isFetching: PropTypes.bool,
  invoices: PropTypes.array
}

export default connect(mapStateToProps)(InvoiceList)
