import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import 'style-loader!react-select/scss/default.scss'
import { updateDateRange } from './actions'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import 'style-loader!react-bootstrap-daterangepicker/css/daterangepicker.css'
import 'style-loader!./style.css'
import moment from 'moment'
import cx from 'classnames'

const ReactHighcharts = require('react-highcharts');

const dateFormat = 'MM/DD/YY';

const config = {
  chart: {
    type: 'area'
  },
  title: {
    text: ''
  },
  plotOptions: {
    area: {
      stacking: 'normal',
    },
    series: {
      pointInterval: 24 * 3600 * 1000 // one day
    }
  },
  xAxis: {
    type: 'datetime'
  },
  yAxis: {
    title: {
      text: 'Hours'
    }
  }
};

const pieConfig = {
  chart: {
    type: 'pie'
  },
  title: {
    text: ''
  },
  plotOptions: {
    pie: {
      showInLegend: true
    }
  },
  legend: {
    enabled: false
  }
};

class Widget extends Component {
  constructor(props) {
    super(props);

    this.state = {
      startDate: moment().subtract(1, 'weeks').startOf('isoWeek'),
      endDate: moment().subtract(1, 'weeks').endOf('isoWeek').subtract(1, 'day'),
      ranges: {
        'Today': [ moment(), moment() ],
        'Yesterday': [ moment().subtract(1, 'days'), moment().subtract(1, 'days') ],
        'Last 7 Days': [ moment().subtract(6, 'days'), moment() ],
        'Last 30 Days': [ moment().subtract(29, 'days'), moment() ],
        'This Week': [ moment().startOf('isoWeek'), moment()],
        'Last Week': [ moment().subtract(1, 'weeks').startOf('isoWeek'),
          moment().subtract(1, 'weeks').endOf('isoWeek').subtract(1, 'day')],
        'This Month': [ moment().startOf('month'), Math.min(moment().endOf('month'), moment()) ],
        'Last Month': [ moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month') ]
      }
    }
  }

  componentWillMount() {
    config.plotOptions.series.pointStart = this.state.startDate.valueOf();
    this.props.updateDateRange(this.state.startDate, this.state.endDate);
  }

  selectClient( client ) {
    if ( client ) {
      this.props.selectClient(this.props.name, this.props.id, client.value);
    } else {
      this.props.clearClient(this.props.id, { client: this.props.data.client });
    }
  }

  setDateRange = ( event, picker ) => {
    this.setState({
      startDate: picker.startDate,
      endDate: picker.endDate
    });
    config.plotOptions.series.pointStart = picker.startDate.valueOf();
    this.props.updateDateRange(picker.startDate, picker.endDate)
  };

  render() {
    const { data, status, isFetching, didInvalidate } = this.props;
    let avgBillableHours, avgClass;

    if (!isFetching && data.series && data.aggregate) {
      config.series = data.series;
      pieConfig.series = [ {
        data: [ {
          y: data.aggregate.billable,
          name: "Billable"
        }, {
          y: data.aggregate.unbillable,
          name: "Unbillable"
        } ]
      } ]

      avgBillableHours = Math.round(data.aggregate.billable / data.aggregate.workDays);
      avgClass = cx({
        'status--red': data.aggregate.billable / data.aggregate.workDays / config.series.length < 4
      });
    }

    var start = this.state.startDate.format(dateFormat);
    var end = this.state.endDate.format(dateFormat);
    var label = start + ' - ' + end;
    if ( start === end ) {
      label = start;
    }

    return (
      <div>
        <h2>Logged Hours</h2>
        <DateRangePicker
          startDate={this.state.startDate}
          endDate={this.state.endDate}
          onApply={this.setDateRange}
          ranges={this.state.ranges}
        >
          Date range: <span className="date__label">{label}</span>
        </DateRangePicker>
        <div className="loading">{status}</div>
        {!isFetching && data.aggregate &&
          <div className="row-fluid">
            <div className="span8">
              <ReactHighcharts config={config} />
            </div>
            <div className="span4">
              <table className="table table-bordered cashboard-billable-summary-table">
                <tbody>
                <tr>
                  <th>Billable Hours</th>
                  <td>{data.aggregate.billable}</td>
                </tr>
                <tr>
                  <th>Unbillable Hours</th>
                  <td>{data.aggregate.unbillable}</td>
                </tr>
                <tr>
                  <th>Average Billable Hours (per member)</th>
                  <td className={avgClass}>{avgBillableHours}</td>
                </tr>
                </tbody>
              </table>
              <ReactHighcharts config={pieConfig} />
            </div>
          </div>
        }
      </div>
    )
  }
}

Widget.propTypes = {
  isFetching: PropTypes.bool,
  status: PropTypes.string,
  data: PropTypes.object,
  selectClient: PropTypes.func
};

const mapDispatchToProps = ( dispatch, props ) => {
  return {
    updateDateRange: ( startDate, endDate ) => {
      dispatch(updateDateRange(props.name, props.id, { startDate, endDate }));
    }
  }
};

const mapStateToProps = ( state, ownProps ) => {
  const id = ownProps.id;

  const {
    isFetching,
    didInvalidate,
    status,
    data
  } = state.dataByService[ ownProps.id ] || {
    isFetching: true,
    didInvalidate: false,
    status: 'Loading',
    data: {
      aggregate: {},
    }
  };

  if ( didInvalidate ) {
    data.clientId = '';
  }

  return {
    isFetching,
    didInvalidate,
    status,
    data,
    id
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Widget)
