import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import InvoiceList from '../../src/components/InvoiceList'

class Widget extends Component {
  render() {
    const { data, isFetching } = this.props;
    return (
      <div>
        <h2>Invoices</h2>
        {isFetching &&
          React.createElement('div', {className: 'loading large'},
            'Loading ',
            React.createElement('img', {src: '/images/ajax-loader.gif'}))
        }
        {!isFetching &&
        <InvoiceList>{data}</InvoiceList>
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
