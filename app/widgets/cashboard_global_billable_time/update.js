widgets.cashboard_global_billable_time = function(data, $) {
  function group(obj, key, value) {
    if (!(obj[key])) {
      obj[key] = value;
    } else {
      if (typeof(value) === "number") {
        obj[key] = obj[key] + value;
      } else {
        Object.keys(value).forEach(function(subKey) {
          group(obj[key], subKey, value[subKey]);
        });
      }
    }
  }

  function workingDaysBetweenDates(origStartDate, origEndDate) {
    var startDate = new Date(origStartDate.getTime()),
        endDate = new Date(origEndDate.getTime());

    // Validate input
    if (endDate < startDate)
      return 0;

    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0,0,0,1);  // Start just after midnight
    endDate.setHours(23,59,59,999);  // End just before midnight
    var diff = endDate - startDate;  // Milliseconds between datetime objects    
    var days = Math.ceil(diff / millisecondsPerDay);

    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    var days = days - (weeks * 2);

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();

    // Remove weekend not previously removed.   
    if (startDay - endDay > 1)         
      days = days - 2;      

    // Remove start day if span starts on Sunday but ends before Saturday
    if (startDay == 0 && endDay != 6)
      days = days - 1  

    // Remove end day if span ends on Saturday but starts after Sunday
    if (endDay == 6 && startDay != 0)
      days = days - 1  

    return days;
  }

  function generateStackedTimePlotFor(obj, $target, origStartDate, origEndDate) {
    var startDate = new Date(origStartDate.getTime()),
        endDate = new Date(origEndDate.getTime()),
        plotSeries = [],
        keys = Object.keys(obj);

    plotSeries[0] = {
      color: "#ebc4c4",
      label: "[break even]",
      stack: false,
      data: [],
      points: {
        show: false
      }
    };

    for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      var day = new Date(d),
          dayDate = day.getDate(),
          dayMonth = day.getMonth(), //Months are zero based
          dayYear = day.getFullYear()
          formattedDay = dayYear + "-" + (dayMonth + 1) + "-" + dayDate;
          dayInt = +(day);

      // Break-even is ~$15k/mo, so 15000 / 30 days a month / number of weekdays in a week (5/7) = 700
      var breakEvenAmount = [0,6].indexOf(day.getDay()) >= 0 ? 0 : 700;
      plotSeries[0]['data'].push([dayInt, breakEvenAmount]);

      keys.forEach(function(key) {
        var keyIndex = keys.indexOf(key) + 1,
            value = obj[key][dayInt] || 0,
            coords = [dayInt, value];
        if (plotSeries[keyIndex] === undefined) {
          plotSeries[keyIndex] = {
            label: key,
            data: [coords],
            hoverable: true
          };
        } else {
          plotSeries[keyIndex]['data'].push(coords);
        }
      });
    }

    console.log(plotSeries);

    $.plot($target, plotSeries, {
      series: {
        stack: true,
        lines: {
          show: true,
          fill: true,
          steps: false
        },
        points: {
          show: true,
          symbol: "circle"
        }
      },
      yaxis: {
        mode: "money",
        tickFormatter: function (v, axis) { return "$" + v.toFixed(axis.tickDecimals) }
      },
      xaxis: {
        mode: "time",
        minTickSize: [1, "day"],
        min: startDateInt,
        max: endDateInt,
        timeformat: "%a"
      },
      grid: {
        hoverable: true,
        clickable: true
      }
    });
  }

  var $target = $('#widget-' + data.id),
      rows = "";
  if (data.results && data.results.length > 0) {
    var hoursByRate = {},
        hoursByProject = {},
        hoursByMember = {},
        hoursByDayByMember = {},
        hoursByDayByProject = {},
        hoursByMemberByDay = {},
        hoursByProjectByDay = {},
        totalHours = 0,
        totalBillable = 0;
    $.each(data.results, function(i, entry) {
      var createdAt = new Date(entry.created_on),
          hours = entry.minutes / 60.0,
          rate = parseFloat(entry.billable_rate),
          pay_rate = parseFloat(entry.pay_rate),
          billable = hours * (rate - pay_rate),
          currDate = createdAt.getDate(),
          currMonth = createdAt.getMonth(), //Months are zero based
          currYear = createdAt.getFullYear()
          created = new Date(currYear, currMonth, currDate),
          createdInt = +(created), // Make sure both dates are compared as integers
          formattedDate = currYear + "-" + (currMonth + 1) + "-" + currDate;
      rows += '<tr' + (rate <= 0 ? ' class="zero-rate"' : '') + '>';
      rows += '<td>' + formattedDate + '</td>';
      rows += '<td>' + entry.person_name + '</td>';
      rows += '<td>' + entry.project_name + '</td>';
      rows += '<td>' + hours + '</td>';
      rows += '<td>$' + rate.formatMoney(2, '.', ',') + '</td>';
      rows += '<td>($' + pay_rate.formatMoney(2, '.', ',') + ')</td>';
      rows += '<td>$' + billable.formatMoney(2, '.', ',') + '</td>';
      rows += '<td>' + entry.description + '</td>';
      rows += '</tr>';

      totalHours += hours;
      totalBillable += billable;

      group(hoursByRate, rate, hours);
      group(hoursByProject, entry.project_name, hours);
      group(hoursByMember, entry.person_name, hours);

      var personHours = {};
      personHours[entry.person_name] = hours;
      group(hoursByDayByMember, formattedDate, personHours)

      var projectHours = {};
      projectHours[entry.project_name] = hours;
      group(hoursByDayByProject, formattedDate, projectHours)

      var dayHours = {};
      dayHours[createdInt] = billable;
      group(hoursByMemberByDay, entry.person_name, dayHours)

      var dayHours = {};
      dayHours[createdInt] = billable;
      group(hoursByProjectByDay, entry.project_name, dayHours)
    });

    console.log(hoursByRate);
    console.log(hoursByProject);
    console.log(hoursByMember);
    console.log(hoursByDayByMember);
    console.log(hoursByDayByProject);
    console.log(hoursByMemberByDay);
    console.log(hoursByProjectByDay);

    var startDateVal = $target.find('input[name="start_date"]').val().split('-'),
        endDateVal = $target.find('input[name="end_date"]').val().split('-'),
        startDate = new Date(startDateVal[0], (startDateVal[1] - 1), startDateVal[2]),
        endDate = new Date(endDateVal[0], (endDateVal[1] - 1), endDateVal[2]),
        startDateInt = +(startDate),
        endDateInt = +(endDate);

    var workDays = workingDaysBetweenDates(startDate, endDate),
        totalBreakEven = workDays * 700;

    $target.find('.total-hours').html(totalHours);
    $target.find('.total-billable').html('$' + totalBillable.formatMoney(2, '.', ','));
    $target.find('.average-hourly-rate').html('$' + (totalBillable / totalHours).formatMoney(2, '.', ','));
    $target.find('.cashboard-billable-table tbody').html(rows);

    $target.find('.total-break-even').html('($' + totalBreakEven.formatMoney(2, '.', ',') + ')');

    generateStackedTimePlotFor(hoursByMemberByDay, $target.find('.hours-by-day-by-member'), startDate, endDate);
    generateStackedTimePlotFor(hoursByProjectByDay, $target.find('.hours-by-day-by-project'), startDate, endDate);

  } else if (data.error) {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div></td></tr>');
  } else {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="No results">No results</div></td></tr>');
  }
  $target.find('.refresh-service[data-service="cashboard_global_billable_time"]').removeClass('disabled').html('<i class="icon-filter"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
