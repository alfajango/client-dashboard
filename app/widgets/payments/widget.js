import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import PaymentList from '../../src/components/PaymentList'

class Widget extends Component {
  render() {
    const { data, isFetching } = this.props;
    return (
      <div>
        <h2>Payments</h2>
        {isFetching &&
          React.createElement('div', {className: 'loading large'},
            'Loading ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
        }
        {!isFetching &&
        <PaymentList>{data}</PaymentList>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  data: PropTypes.array
};

function mapStateToProps(state, ownProps) {
  const {
    isFetching,
    data,
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    data: []
  };

  return {
    isFetching,
    data
  }
}

export default connect(mapStateToProps)(Widget)
