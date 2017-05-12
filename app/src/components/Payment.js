import React from 'react'
import PropTypes from 'prop-types'
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
    {!attributes.url &&
    <td style={{whiteSpace: 'nowrap'}}>{attributes.id}</td>
    }
    {attributes.url &&
    <td style={{whiteSpace: 'nowrap'}}>
      <a href={attributes.url} target="_blank">{attributes.id}</a>
    </td>
    }
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
    notes: PropTypes.string,
    url: PropTypes.string
  })
};

const mapStateToProps = (state, json) => {
  return {
    id: json.children.id,
    attributes: json.children.attributes
  }
};

export default connect(mapStateToProps)(Payment)
