import React, { PropTypes } from 'react'
import Invoice from './Invoice'
import {FormattedNumber} from 'react-intl';
import { connect } from 'react-redux'
import { receiveData } from '../actions'

const InvoiceList = React.createClass({
  totalAmount() {
    let sum = 0;
    for (var i in this.props.invoices) {
      sum += this.props.invoices[i].attributes.amount
    }
    return sum.toString()
  },

  render() {
    const {invoices} = this.props;
    return (
      <div>
        <table className="table table-bordered">
          <thead>
          <tr>
            <th>Date</th>
            <th>Invoice No.</th>
            <th>Amount</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
          </thead>
          <tbody>
          {invoices.map(function(invoice) {
            return <Invoice key={invoice.id}>{invoice}</Invoice>;
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
});

function mapStateToProps(state, ownProps) {
  return {
    invoices: ownProps.children
  }
}

InvoiceList.propTypes = {
  invoices: PropTypes.array
};

export default connect(mapStateToProps)(InvoiceList)
