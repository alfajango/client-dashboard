import React, { PropTypes } from 'react'
import Payment from './Payment'
import { connect } from 'react-redux'
import { receiveData } from '../actions'

const PaymentList = ({ isFetching, payments }) => (
  <div>
    <table>
      <thead>
      <tr>
        <th>ID</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Notes</th>
      </tr>
      </thead>
      <tbody>
      {payments.map(function(payment) {
        return <Payment key={payment.id}>{payment}</Payment>;
      })}
      </tbody>
    </table>
  </div>
);

function mapStateToProps(state, ownProps) {
  return {
    payments: ownProps.children
  }
}

PaymentList.propTypes = {
  payments: PropTypes.array
};

export default connect(mapStateToProps)(PaymentList)
