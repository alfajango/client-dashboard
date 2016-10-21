var ioutils = require( '../ioutils' );
var XDate = require( 'xdate' );
var auth = require( __dirname + '/../../../lib/authentication' );
var _ = require( 'underscore' );

exports.fetch = function ( service, callback, settings ) {
  var widget = this;
  widget.user = settings.user;
  widget.fetchAPI = ioutils.createFetchAPI( 'https', options( service ) );
  widget.io = ioutils.updates( service, callback );
  widget.start_date = new XDate( ...'2016-08-08'.split( '-' ) );
  widget.end_date = new XDate( ...'2016-08-12'.split( '-' ) );
  widget.dateFormat = 'yyyy-MM-dd';

  var employeesResult = {};
  var timeLoggedResult = {};

  widget.io.updateStatus( 'Getting users and logged time entries' );
  utils.when( function ( done ) {
    var path = '/employees';
    widget.fetchAPI( 'user', path, employeesResult, done );
  }, function ( done ) {
    var path = '/time_entries?start_date=' + widget.start_date.toString( widget.dateFormat )
      + '&end_date=' + widget.end_date.toString( widget.dateFormat );
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
    var timeEntries = widget.translate( timeLoggedResult.data );
    var billableTimeEntries = timeEntries.filter( widget.filterBillable );
    var employees = widget.translateEmployees( employeesResult.data );
    var billableTime = widget.totalTime( timeEntries, widget.filterBillable );
    var unbillableTime = widget.totalTime( timeEntries, widget.filterUnbillable );

    widget.io.updateData( {
      type: 'aggregate',
      billable: billableTime,
      unbillable: unbillableTime
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
          return date_cursor.getFullYear() == timeEntry.created_on.getFullYear() && date_cursor.getMonth() == timeEntry.created_on.getMonth() && date_cursor.getDate() == timeEntry.created_on.getDate();
        } );
        var totalTimeForDay = 0;
        for ( var j = 0 ; j < timeEntriesForDate.length ; j++ ) {
          totalTimeForDay += timeEntriesForDate[ j ].minutes;
        }
        seriesData.push( totalTimeForDay );
        date_cursor.addDays( 1 );
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
exports.translate = function ( data ) {
  data = data.map( this.convertDates );

  data = data.map( function ( timeEntry ) {
    return {
      person_id: timeEntry.person_id,
      created_on: timeEntry.created_on,
      is_billable: timeEntry.is_billable,
      minutes: timeEntry.minutes
    }
  } );
  return data;
};

exports.translateEmployees = function ( data ) {
  data = data.filter( function ( employee ) {
    return !employee.is_archived;
  } );

  // data = data.filter(function ( employee ) {
  //   var activeEmployees = ['steve@alfajango.com', 'richard@alfajango.com', 'kevin@alfajango.com']
  // });

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
  lineItem.created_on = new XDate( date[ 0 ], date[ 1 ] - 1, date[ 2 ] );
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
    totalTime += lineItems[ i ].minutes;
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
