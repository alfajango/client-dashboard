import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
//import classNames from 'classnames/bind';
//import styles from '../css/status.scss';

//let cx = classNames.bind(styles);

class Dropdown extends Component {
  render() {
    let items = this.props.items;

    return (
      <ul>
        {items.map(function(client) {
          return <li key={client.id}>{client.attributes.name}</li>;
        })}
      </ul>
    );
  }
}

Dropdown.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.shape(
    {
      id: PropTypes.string,
      attributes: PropTypes.shape({
        name: PropTypes.string
      })
    }
  ))
};

const mapStateToProps = (state, json) => {
  return {
    items: json.children
  }
};

export default connect(mapStateToProps)(Dropdown)