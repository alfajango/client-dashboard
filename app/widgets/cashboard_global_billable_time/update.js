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
  var $target = $('#widget-' + data.id),
      rows = "";
  if (data.results && data.results.length > 0) {
    var hoursByRate = {},
        hoursByProject = {},
        hoursByMember = {},
        hoursByDayByMember = {},
        hoursByDayByProject = {},
        hoursByMemberByDay = {},
        totalHours = 0,
        totalBillable = 0;
    $.each(data.results, function(i, entry) {
      var createdAt = new Date(entry.created_on),
          hours = entry.minutes / 60.0,
          rate = parseFloat(entry.billable_rate),
          billable = hours * rate,
          currDate = createdAt.getDate(),
          currMonth = createdAt.getMonth(), //Months are zero based
          currYear = createdAt.getFullYear()
          created = new Date(currYear, currMonth, currDate),
          createdInt = +(created), // Make sure both dates are compared as integers
          formattedDate = currYear + "-" + (currMonth + 1) + "-" + currDate;
      rows += '<tr' + (entry.rate <= 0 ? ' class="zero-rate"' : '') + '>';
      rows += '<td>' + formattedDate + '</td>';
      rows += '<td>' + entry.person_name + '</td>';
      rows += '<td>' + entry.project_name + '</td>';
      rows += '<td>' + hours + '</td>';
      rows += '<td>$' + rate.formatMoney(2, '.', ',') + '</td>';
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

    });

    console.log(hoursByRate);
    console.log(hoursByProject);
    console.log(hoursByMember);
    console.log(hoursByDayByMember);
    console.log(hoursByDayByProject);
    console.log(hoursByMemberByDay);

    $target.find('.total-hours').html(totalHours);
    $target.find('.total-billable').html('$' + totalBillable.formatMoney(2, '.', ','));
    $target.find('.average-hourly-rate').html('$' + (totalBillable / totalHours).formatMoney(2, '.', ','));
    $target.find('.cashboard-billable-table tbody').html(rows);

    var startDateVal = $target.find('input[name="start_date"]').val().split('-'),
        endDateVal = $target.find('input[name="end_date"]').val().split('-'),
        startDate = new Date(startDateVal[0], (startDateVal[1] - 1), startDateVal[2]),
        endDate = new Date(endDateVal[0], (endDateVal[1] - 1), endDateVal[2]),
        startDateInt = +(startDate),
        endDateInt = +(endDate);

    var plotSeries = [],
        members = Object.keys(hoursByMember);
    for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      members.forEach(function(member) {
        var memberIndex = members.indexOf(member),
            day = new Date(d),
            dayDate = day.getDate(),
            dayMonth = day.getMonth(), //Months are zero based
            dayYear = day.getFullYear()
            formattedDay = dayYear + "-" + (dayMonth + 1) + "-" + dayDate;
            dayInt = +(day),
            hours = hoursByMemberByDay[member][dayInt] || 0,
            value = [dayInt, hours];
        if (plotSeries[memberIndex] === undefined) {
          plotSeries[memberIndex] = {
            label: member,
            data: [value],
            hoverable: true
          };
        } else {
          plotSeries[memberIndex]['data'].push(value);
        }
      });
    }

    console.log(plotSeries);

    $.plot($target.find('.hours-by-day-by-member'), plotSeries, {
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
      xaxis: {
        mode: "time",
        minTickSize: [1, "day"],
        min: startDateInt,
        max: endDateInt,
        timeformat: "%a"
      }
    });
  } else if (data.error) {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div></td></tr>');
  } else {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="No results">No results</div></td></tr>');
  }
  $target.find('.refresh-service[data-service="cashboard_global_billable_time"]').removeClass('disabled').html('<i class="icon-filter"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
