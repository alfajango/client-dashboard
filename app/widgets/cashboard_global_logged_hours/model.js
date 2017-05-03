'use strict';

var ioutils = require( '../ioutils' );
var moment = require( 'moment' );
require( 'moment-weekday-calc' );
var auth = require( __dirname + '/../../../lib/authentication' );
var _ = require( 'underscore' );
var dateFormat = 'YYYY-MM-DD';

exports.fetch = function ( service, callback, settings ) {
  var widget = this;
  widget.user = settings.user;
  widget.fetchAPI = ioutils.createFetchAPI( 'https', options( service ) );
  widget.io = ioutils.updates( service, callback );
  if (!settings.startDate || !settings.endDate) {
    widget.io.updateData({
      type: 'nothing',
      data: null
    });
    return
  }

  widget.start_date = new moment( settings.startDate, dateFormat );
  widget.end_date = new moment( settings.endDate, dateFormat );

  var employeesResult = {};
  var timeLoggedResult = {};

  widget.io.updateStatus( 'Loading logged time entries' );
  utils.when( function ( done ) {
    var path = '/employees';
    widget.fetchAPI( 'user', path, employeesResult, done );
  }, function ( done ) {
    var path = '/time_entries?start_date=' + widget.start_date.format( dateFormat )
      + '&end_date=' + widget.end_date.format( dateFormat );
    widget.fetchAPI( 'time entries', path, timeLoggedResult, done );
  } ).then( function () {
    if ( employeesResult.error ) {
      widget.io.updateError( 'Unable to get users' );
      return
    }
    if ( timeLoggedResult.error ) {
      widget.io.updateError( 'Unable to get logged time' );
      return
    }
    var employees = widget.translateEmployees( employeesResult.data );
    var employeeIds = employees.map(function(e) {return e.id});
    var timeEntries = widget.translate( timeLoggedResult.data, employeeIds );
    var billableTimeEntries = timeEntries.filter( widget.filterBillable );
    var billableTime = widget.totalTime( timeEntries, widget.filterBillable );
    var unbillableTime = widget.totalTime( timeEntries, widget.filterUnbillable );

    widget.io.updateData( {
      type: 'aggregate',
      data: {
        billable: billableTime,
        unbillable: unbillableTime,
        workDays: widget.weekdays(widget.start_date, widget.end_date)
      }
    } );

    var chartData = [];
    var employeeIdsWithTimeEntries = getUniqueValues( billableTimeEntries, 'person_id' );
    for ( let employeeId of employeeIdsWithTimeEntries ) {
      var employeeTimeEntries = billableTimeEntries.filter( function ( timeEntry ) {
        return timeEntry.person_id == employeeId;
      } );
      var seriesData = [];
      var date_cursor = widget.start_date.clone();
      while ( date_cursor <= widget.end_date ) {
        var timeEntriesForDate = employeeTimeEntries.filter( function ( timeEntry ) {
          return date_cursor.year() === timeEntry.created_on.year() && date_cursor.month() === timeEntry.created_on.month() && date_cursor.date() === timeEntry.created_on.date();
        } );
        var totalTimeForDay = 0;
        if (date_cursor > widget.start_date) {
          totalTimeForDay = seriesData[seriesData.length - 1]
        }
        for ( var j = 0 ; j < timeEntriesForDate.length ; j++ ) {
          totalTimeForDay += timeEntriesForDate[ j ].time;
        }
        seriesData.push( totalTimeForDay );
        date_cursor.add( 1, 'days' );
      }
      var employee = widget.findEmployeeById( employees, employeeId );
        var employeeName = employee.first_name + ' ' + employee.last_name;
        chartData.push( {
          name: employeeName,
          data: seriesData
        } )
    }

    widget.io.updateData( {
      type: 'series',
      data: chartData
    } );

    // Get a list of employees with timeEntries
    // For each employee, generate a series of total time (sum of timeEntries) per day for date range
    // var chartData =

    // var employeeId = widget.findCurrentEmployee( employees );
  } );
};

exports.dateFormat = 'YYYY-MM-DD';

exports.weekdays = function(startDate, endDate) {
  return moment().isoWeekdayCalc({
    rangeStart: startDate,
    rangeEnd: endDate,
    weekdays: [1,2,3,4,5],
  });
}

exports.findEmployeeById = function ( data, id ) {
  var employee = data.filter( function ( e ) {
    return e.id == id;
  } );
  if ( employee.length >= 1 ) {
    return employee[ 0 ];
  } else {
    return null;
  }
};

exports.findCurrentEmployee = function ( data ) {
  var widget = this;
  var employee = data.filter( function ( e ) {
    return e.email_address == widget.user;
  } );
  if ( employee.length >= 1 ) {
    return employee[ 0 ].id;
  } else {
    return null;
  }
};

// Translate fetched response to db store format
exports.translate = function ( data, employeeIds ) {
  data = data.map( this.convertDates );

  var newData = [];

  for (let datum of data) {
    if (employeeIds.indexOf(datum.person_id) > -1) {
      newData.push( {
        person_id: datum.person_id,
        created_on: datum.created_on,
        is_billable: datum.is_billable,
        time: datum.minutes / 60
      } )
    }
  }

  return newData;
};

exports.translateEmployees = function ( data ) {
  data = data.filter( function ( employee ) {
    return !employee.is_archived;
  } );

  data = data.filter(function ( employee ) {
    return employee.email_address.includes('@alfajango.com');
  });

  data = data.map( function ( employee ) {
    return {
      id: employee.id,
      email_address: employee.email_address,
      first_name: employee.first_name,
      last_name: employee.last_name
    }
  } );
  return data;
};

exports.convertDates = function ( lineItem ) {
  var date = lineItem.created_on.split( 'T' )[ 0 ].split( '-' );
  lineItem.created_on = new moment( date, dateFormat );
  return lineItem;
};

exports.filterBillable = function ( lineItem ) {
  return !!lineItem.is_billable;
};

exports.filterUnbillable = function ( lineItem ) {
  return !lineItem.is_billable;
};

exports.timerStopped = function ( lineItem ) {
  return !lineItem.is_running;
};

exports.totalTime = function ( lineItems, filter ) {
  lineItems = lineItems.filter( filter );
  var totalTime = 0;
  for ( var i = 0 ; i < lineItems.length ; i++ ) {
    totalTime += lineItems[ i ].time;
  }
  return totalTime;
};

function getUniqueValues ( array, key ) {
  var result = new Set();
  array.forEach( function ( item ) {
    if ( item.hasOwnProperty( key ) ) {
      result.add( item[ key ] );
    }
  } );
  return result;
}

function options ( service ) {
  var auth = 'Basic ' + new Buffer( service.user + ':' + service.token ).toString( 'base64' );
  return {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };
}
