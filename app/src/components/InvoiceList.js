import React, { PropTypes } from 'react'
import Invoice from './Invoice'
import { connect } from 'react-redux'
import { receiveData } from '../actions'

const InvoiceList = ({ invoices }) => (
  <div>
    <table className="table table-bordered">
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
  </div>
);

function mapStateToProps(state, ownProps) {
  return {
    invoices: ownProps.children
  }
}

InvoiceList.propTypes = {
  invoices: PropTypes.array
};

export default connect(mapStateToProps)(InvoiceList)
