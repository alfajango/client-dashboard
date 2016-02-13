import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

const Invoice = ({ id, attributes }) => (
  <tr>
    <td>{id}</td>
    <td>{attributes.amount}</td>
    <td>{attributes.date}</td>
    <td>{attributes.due}</td>
    <td>{attributes.status}</td>
  </tr>
)

Invoice.propTypes = {
  id: PropTypes.string,
  attributes: PropTypes.shape({
    amount: PropTypes.number,
    date: PropTypes.string,
    due: PropTypes.string,
    status: PropTypes.string
  })
}

const mapStateToProps = (state, json) => {
  return {
    id: json.children.id,
    attributes: json.children.attributes
  }
}

export default connect(mapStateToProps)(Invoice)
