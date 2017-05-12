import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Payment from './Payment'
import {FormattedNumber} from 'react-intl';
import { connect } from 'react-redux'
import { receiveData } from '../actions'

class PaymentList extends Component {
  totalAmount() {
    let sum = 0;
    for (var i in this.props.payments) {
      sum += this.props.payments[i].attributes.amount
    }
    return sum.toString()
  }

  render() {
    const {payments} = this.props;
    return (
      <div>
        <table className="table table-bordered">
          <thead>
          <tr>
            <th>Date</th>
            <th>ID</th>
            <th>Amount</th>
            <th>Notes</th>
          </tr>
          </thead>
          <tbody>
          {payments.map(function(payment) {
            return <Payment key={payment.id}>{payment}</Payment>;
          })}
          <tr>
            <td colSpan="2">TOTAL</td>
            <td style={{textAlign: 'right'}}>
              <FormattedNumber value={this.totalAmount()} style="currency" currency="USD" />
            </td>
            <td colSpan="3"></td>
          </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    payments: ownProps.children
  }
}

PaymentList.propTypes = {
  payments: PropTypes.array
};

export default connect(mapStateToProps)(PaymentList)
