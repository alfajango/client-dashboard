import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {FormattedNumber, FormattedDate} from 'react-intl';
import classNames from 'classnames/bind';
import styles from '../css/status.scss';

let cx = classNames.bind(styles);

class Invoice extends Component {
  render() {
    const {attributes, user} = this.props;
    let statusClass = cx({
      'status': true,
      'status--green': attributes.status == 'Paid',
      'status--yellow': attributes.id == 'Unbillable',
      'status--orange': attributes.status !== 'Paid' && attributes.status !== 'Uninvoiced' && attributes.id !== 'Unbillable' && !pastDue(attributes.due),
      'status--red': attributes.status !== 'Paid' && attributes.status !== 'Uninvoiced' && attributes.id !== 'Unbillable' && pastDue(attributes.due)
    });
    return (
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
        <td>
          <FormattedDate
            value={attributes.due}
            day="numeric"
            month="numeric"
            year="numeric" />
        </td>
        <td className={statusClass}>{attributes.status}</td>
      </tr>
    );

    function pastDue(date) {
      let y, m, d;
      [y, m, d] = date.split('-');
      let dueDate = new Date(y, m - 1, d);
      return dueDate < Date.now()
    }
  }
}

Invoice.propTypes = {
  id: PropTypes.string,
  attributes: PropTypes.shape({
    id: PropTypes.string,
    amount: PropTypes.number,
    date: PropTypes.string,
    due: PropTypes.string,
    status: PropTypes.string,
    url: PropTypes.string
  })
};

const mapStateToProps = (state, json) => {
  return {
    id: json.children.id,
    attributes: json.children.attributes
  }
};

export default connect(mapStateToProps)(Invoice)
