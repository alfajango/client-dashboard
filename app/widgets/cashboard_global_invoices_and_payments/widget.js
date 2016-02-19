import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Dropdown from '../../src/components/Dropdown'

class Widget extends Component {
  render() {
    const { data, status, isFetching } = this.props;
    return (
      <div>
        <h2>Invoices and Payments</h2>
        {isFetching &&
          React.createElement('div', {className: 'loading large'},
            status,
            ' ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
        }
        {!isFetching &&
        <Dropdown>{data}</Dropdown>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.array
};

function mapStateToProps(state, ownProps) {
  const {
    isFetching,
    status,
    data,
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    status: 'Loading',
    data: []
  };

  return {
    isFetching,
    status,
    data
  }
}

export default connect(mapStateToProps)(Widget)
