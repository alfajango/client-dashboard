import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import {FormattedNumber, FormattedDate} from 'react-intl';

const Payment = ({ attributes }) => (
  <tr>
    <td>
      <FormattedDate
        value={attributes.date}
        day="numeric"
        month="numeric"
        year="numeric" />
    </td>
    <td style={{whiteSpace: 'nowrap'}}>{attributes.id}</td>
    <td style={{textAlign: 'right'}}>
      <FormattedNumber value={attributes.amount} style="currency" currency="USD" />
    </td>
    <td>{attributes.notes}</td>
  </tr>
);

Payment.propTypes = {
  id: PropTypes.string,
  attributes: PropTypes.shape({
    id: PropTypes.string,
    amount: PropTypes.number,
    date: PropTypes.string,
    notes: PropTypes.string
  })
};

const mapStateToProps = (state, json) => {
  return {
    id: json.children.id,
    attributes: json.children.attributes
  }
};

export default connect(mapStateToProps)(Payment)
