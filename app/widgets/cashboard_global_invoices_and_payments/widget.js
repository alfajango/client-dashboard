import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import 'style!react-select/scss/default.scss'

var Widget = React.createClass({
  getInitialState() {
    return {
      selectValue: ""
    }
  },

  selectClient(value) {
    console.log(value);
    this.setState({selectValue:value});
  },

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
        <Select
          autofocus
          value = {this.state.selectValue}
          options = {this.props.data}
          onChange = {this.selectClient}
        />
        }
      </div>
    )
  }
})

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.array
};

function mapStateToProps(state, ownProps) {
  const {
    isFetching,
    status
    } = state.dataByService[ownProps.id] || {
    isFetching: true,
    status: 'Loading'
  };

  var data;
  if(state.dataByService[ownProps.id]) {
    data = state.dataByService[ownProps.id].data.map(i => ({value:i.id,label:i.attributes.name}))
  } else {
    data = []
  }

  return {
    isFetching,
    status,
    data
  }
}

export default connect(mapStateToProps)(Widget)
