import React, {PropTypes} from 'react';
import {render} from 'react-dom';

var Widget = require('../widgets/invoices_and_payments/widget');

const test_es6 = () => {
  console.log("ES6 functions!");
}

$(document).ready(function() {
  render(<Widget />, document.getElementById('react-demo-container'));
  test_es6();
})
