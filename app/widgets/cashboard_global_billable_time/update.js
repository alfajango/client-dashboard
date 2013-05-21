$(document).delegate('.cashboard-global-time-shortcut', 'click', function(e) {
  var $this = $(this),
      $parent = $this.closest('form'),
      shortcut = $this.attr('href').replace('#cashboard-global-', ''),
      start,
      end,
      d = new Date(),
      date = d.getDate(),
      day = d.getDay(),
      month = d.getMonth(),
      year = d.getFullYear(),
      diff,
      formatted = function(date) {
        return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
      };
  switch (shortcut) {
    case "last-month":
      start = new Date(year, month-1, 1);
      end = new Date(year, month, 0);
      break;
    case "last-week":
      diff = date - day + (day == 0 ? -6:1); // adjust when day is sunday
      start = new Date(d.setDate(diff-7));
      end = new Date(start.getTime());
      end = new Date(end.setDate(start.getDate() + 6));
      break;
    case "this-month":
      start = new Date(year, month, 1);
      end = new Date(year, month+1, 0);
      break;
    default:
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
      start = new Date(d.setDate(diff));
      end = new Date(start.getTime());
      end = new Date(end.setDate(start.getDate() + 6));
      break;
  }


  start = formatted(start);
  end = formatted(end);

  $parent.find('input[name="start_date"]').val(start);
  $parent.find('input[name="end_date"]').val(end);
  $parent.find('button').click();

  e.preventDefault();
});

widgets.cashboard_global_billable_time = function(data, $) {
  var GOLDEN_RATIO = 0.618033988749895;
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

  // HSV values in [0..1[
  // returns [r, g, b] values from 0 to 255
  // See http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  function hsv_to_rgb(h, s, v) {
    var h_i, f, p, q, t, r, g, b;
    h_i = parseInt(h*6);
    f = h*6 - h_i;
    p = v * (1 - s);
    q = v * (1 - f*s);
    t = v * (1 - (1 - f) * s);
    if (h_i==0) { r = v; g = t; b = p; }
    if (h_i==1) { r = q; g = v; b = p; }
    if (h_i==2) { r = p; g = v; b = t; }
    if (h_i==3) { r = p; g = q; b = v; }
    if (h_i==4) { r = t; g = p; b = v; }
    if (h_i==5) { r = v; g = p; b = q; }
    return [parseInt(r*256), parseInt(g*256), parseInt(b*256)];
  }

  function generate_css_series_colors(tracks) {
    var out = [],
        colors,
        hue = 0.45, // or mix it up with Math.random()
        saturation = 0.7,
        value = 0.75; // aka brightness
    tracks.forEach (function(track) {
      hue += GOLDEN_RATIO;
      hue %= 1;
      colors = hsv_to_rgb(hue, saturation, value);
      out.push( "rgb(" + colors + ")");
    });
    return out;
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

  function generateStackedTimePlotFor(obj, $target, origStartDate, origEndDate, cumulative) {
    var startDate = new Date(origStartDate.getTime()),
        endDate = new Date(origEndDate.getTime()),
        plotSeries = [],
        keys = Object.keys(obj),
        startDateInt = +(startDate),
        endDateInt = +(endDate);

    // If bar chart, add 1 day to x-axis to make bar width viewable
    if (!cumulative) {
      endDate = endDate.setDate(endDate.getDate() + 1);
      endDateInt = +(endDate);
    }

    plotSeries[0] = {
      color: "#ebc4c4",
      label: "[break even]: n/a",
      stack: false,
      data: [],
      points: {
        show: false
      },
      lines: {
        show: true,
        fill: true,
        steps: !cumulative
      },
    };

    for (var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      var day = new Date(d),
          dayDate = day.getDate(),
          dayMonth = day.getMonth(), //Months are zero based
          dayYear = day.getFullYear(),
          formattedDay = dayYear + "-" + (dayMonth + 1) + "-" + dayDate,
          dayInt = +(day);

      // Break-even is ~$15k/mo, so 15000 / 30 days a month / number of weekdays in a week (5/7) = 700
      var breakEvenAmount = [0,6].indexOf(day.getDay()) >= 0 ? 0 : 700;
      if (cumulative) {
        var data = plotSeries[0]['data'];
        if (data.length) { breakEvenAmount += data[data.length-1][1]; }
      }
      plotSeries[0]['data'].push([dayInt, breakEvenAmount]);

      var colors = generate_css_series_colors(keys);
      console.log(colors);

      keys.forEach(function(key) {
        var keyIndex = keys.indexOf(key) + 1,
            value = obj[key][dayInt] || 0;

        if (plotSeries[keyIndex] === undefined) {
          plotSeries[keyIndex] = {
            label: key + ': n/a',
            data: [[dayInt, value]],
            color: colors[keyIndex],
            hoverable: true,
            lines: {
              show: cumulative, // Show lines if cumulative chart
              fill: true,
              steps: false
            },
            bars: {
              show: !cumulative, // Show bars if not cumulative chart
              fill: true,
              barWidth: 1000*60*60*24
            }
          };
        } else {
          if (cumulative) {
            var data = plotSeries[keyIndex]['data'];
            if (data.length) { value += data[data.length-1][1]; }
          }
          plotSeries[keyIndex]['data'].push([dayInt, value]);
        }
      });
    }

    console.log(plotSeries);

    var plot = $.plot($target, plotSeries, {
      series: {
        stack: true,
        points: {
          show: cumulative,
          radius: 2,
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
      },
      crosshair: {
        mode: "x"
      },
      legend: {
        show: true,
        position: cumulative ? "nw" : "ne"
      }
    });

    var legends = $target.find(".legendLabel");

    legends.each(function () {
      // fix the widths so they don't jump around
      //$(this).css('width', $(this).width() + 20);
    });

    var updateLegendTimeout = null;
    var latestPosition = null;

    function updateLegend() {

      updateLegendTimeout = null;

      var pos = latestPosition;

      var axes = plot.getAxes();
      if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
          pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
        return;
      }

      var i, j, dataset = plot.getData();
      var hoursTotal = 0;
      // Loop through dataset backwards so break even label is written last,
      // this way we can easily include total from all other series
      for (i = dataset.length - 1; i >= 0; --i) {

        var series = dataset[i];

        // Find the nearest points, x-wise

        for (j = 0; j < series.data.length; ++j) {
          if (series.data[j][0] > pos.x) {
            break;
          }
        }

        // Now Interpolate

        var y,
        p1 = series.data[j - 1],
        p2 = series.data[j];

        if (p1 == null) {
          y = p2[1];
        } else if (p2 == null) {
          y = p1[1];
        } else {
          if (series.lines && series.lines.show && !series.lines.steps) {
            y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
          } else {
            y = p1[1];
          }
        }

        if (i > 0) {
          hoursTotal += y;
          y = '$' + y.toFixed(axes.yaxis.tickDecimals);
        } else {
          var diff = hoursTotal - y;
          if (diff < 0) {
            diff = '($' + diff.toFixed(axes.yaxis.tickDecimals) * -1 + ')';
          } else {
            diff = '$' + diff.toFixed(axes.yaxis.tickDecimals);
          }
          y = '($' + y.toFixed(axes.yaxis.tickDecimals) + ')' + ' + $' + hoursTotal.toFixed(axes.yaxis.tickDecimals) + ' = ' + diff;
        }

        legends.eq(i).text(series.label.replace(/:.*/, ": " + y));
      }
    }

    $target.bind("plothover",  function (event, pos, item) {
      latestPosition = pos;
      if (!updateLegendTimeout) {
        updateLegendTimeout = setTimeout(updateLegend, 50);
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

    generateStackedTimePlotFor(hoursByMemberByDay, $target.find('.cumulative-hours-by-day-by-member'), startDate, endDate, true);
    generateStackedTimePlotFor(hoursByProjectByDay, $target.find('.cumulative-hours-by-day-by-project'), startDate, endDate, true);

  } else if (data.error) {
    var msg = '<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>';
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=8></td>' + msg + '</tr>');
    $target.find('.cashboard-billable-summary-table td').html(msg);
    $target.find('.loading.large').hide();
  } else {
    var msg = '<div class="alert alert-error" title="No results">No results</div>';
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=8>' + msg + '</td></tr>');
    $target.find('.cashboard-billable-summary-table td').html(msg);
    $target.find('.loading.large').hide();
  }
  var $button = $target.find('.refresh-service[data-service="cashboard_global_billable_time"]');
  $button.removeClass('disabled').html('<i class="icon-filter"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
  $button.parents('form').find('input,textarea,select').prop('readonly', false);
};
