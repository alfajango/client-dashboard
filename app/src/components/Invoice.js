import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import {FormattedNumber, FormattedDate} from 'react-intl';

const Invoice = ({ attributes }) => (
  <tr>
    <td>{attributes.id}</td>
    <td>
      <FormattedNumber value={attributes.amount} style="currency" currency="USD" />
    </td>
    <td>
      <FormattedDate
        value={attributes.date}
        day="numeric"
        month="long"
        year="numeric" />
    </td>
    <td>
      <FormattedDate
        value={attributes.due}
        day="numeric"
        month="long"
        year="numeric" />
    </td>
    <td>{attributes.status}</td>
  </tr>
);

Invoice.propTypes = {
  id: PropTypes.string,
  attributes: PropTypes.shape({
    id: PropTypes.string,
    amount: PropTypes.number,
    date: PropTypes.string,
    due: PropTypes.string,
    status: PropTypes.string
  })
};

const mapStateToProps = (state, json) => {
  return {
    id: json.children.id,
    attributes: json.children.attributes
  }
};

export default connect(mapStateToProps)(Invoice)
