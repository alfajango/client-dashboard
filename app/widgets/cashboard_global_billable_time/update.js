// Break-even is ~$7400/wk, so 4100 / number of weekdays in a week (5/7) = 1480
var breakEvenWeekday = 1480,
// Goal is ~$8900/wk, so 8900 / number of weekdays in a week (5/7) = 1780
    goalWeekday = 1780;

$(document).delegate('.cashboard-global-time-shortcut', 'click', function(e) {
  var $this = $(this),
      $parent = $this.closest('form'),
      shortcut = $this.attr('href').replace('#cashboard-global-', ''),
      d = new Date(),
      start,
      end,
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

  $parent.find('input[name="start_date"]').val( formatted(start) );
  $parent.find('input[name="end_date"]').val( formatted(end) );
  $parent.find('button').click();

  e.preventDefault();
});

widgets.cashboard_global_billable_time = function(data, $) {
  var GOLDEN_RATIO = 0.618033988749895;
  function nl2br(text) {
    return text.replace(/\n/g, "<br />");
  }

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

    plotSeries[1] = {
      color: "#bde3bd",
      label: "[goal]: n/a",
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

      var breakEvenAmount = [0,6].indexOf(day.getDay()) >= 0 ? 0 : breakEvenWeekday;
      var goalAmount = [0,6].indexOf(day.getDay()) >= 0 ? 0 : goalWeekday;
      if (cumulative) {
        var data = plotSeries[0]['data'];
        if (data.length) { breakEvenAmount += data[data.length-1][1]; }

        data = plotSeries[1]['data'];
        if (data.length) { goalAmount += data[data.length-1][1]; }
      }
      plotSeries[0]['data'].push([dayInt, breakEvenAmount]);
      plotSeries[1]['data'].push([dayInt, goalAmount]);

      var colors = generate_css_series_colors(keys);
      console.log(colors);

      keys.forEach(function(key) {
        var keyIndex = keys.indexOf(key) + 2,
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

    console.log("plotting bars", $target, plotSeries);

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

        if (i > 1) {
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

  function generatePieChart(data, $target) {
    plotData = $.map(data, function(value, key) {
      return {label: key, data: value};
    });
    if (!plotData.length) { console.log("empty"); plotData = [{label: "nuthin' to see here", data: 1}]; }
    console.log("plotting pie", $target, plotData);

    $.plot($target, plotData, {
      series: {
        pie: {
          show: true,
          label: {
            formatter: function (label, slice) {
              return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + slice.data[0][1].formatMoney(2, '.', ',') + "</div>";
            }
          }
        }
      },
      legend: {
        show: false
      }
    });
  }

  var $target = $('#widget-' + data.id),
      rows = "",
      startDateVal = $target.find('input[name="start_date"]').val().split('-'),
      endDateVal = $target.find('input[name="end_date"]').val().split('-'),
      startDate = new Date(startDateVal[0], (startDateVal[1] - 1), startDateVal[2]),
      endDate = new Date(endDateVal[0], (endDateVal[1] - 1), endDateVal[2]),
      startDateInt = +(startDate),
      endDateInt = +(endDate),
      today = new Date(),
      hoursByRate = {},
      hoursByProject = {},
      hoursByMember = {},
      hoursByDayByMember = {},
      hoursByDayByProject = {},
      hoursByMemberByDay = {},
      hoursByProjectByDay = {},
      invoicesByCustomer = {},
      dueInvoicesByCustomer = {},
      paymentsByCustomer = {},
      totalHours = 0,
      totalBillable = 0,
      totalGrossBillable = 0,
      totalUninvoicedNow = 0,
      totalInvoiced = 0,
      totalDueInvoices = 0,
      totalPayments = 0;

  if (data.results) {
    if (data.results.timeEntries && data.results.timeEntries.length > 0) {
      $.each(data.results.timeEntries, function(i, entry) {
        var createdAt = new Date(entry.created_on),
            hours = entry.minutes / 60.0,
            rate = parseFloat(entry.billable_rate),
            pay_rate = parseFloat(entry.pay_rate),
            billable = hours * (rate - pay_rate),
            grossBillable = hours * rate,
            currDate = createdAt.getDate(),
            currMonth = createdAt.getMonth(), //Months are zero based
            currYear = createdAt.getFullYear()
            created = new Date(currYear, currMonth, currDate),
            createdInt = +(created), // Make sure both dates are compared as integers
            formattedDate = currYear + "-" + (currMonth + 1) + "-" + currDate,
            sentenceMatch = entry.description.match(/(^|[\*\.\n])\s*[\w]+/g),
            sentences = ( sentenceMatch && sentenceMatch.length ) || 0,
            sentencesPerHour = parseFloat(sentences) / hours;
        rows += '<tr class="' + (rate <= 0 ? 'zero-rate' : '') + (entry.minutes % 15 ? ' non-fifteen' : '') + (sentencesPerHour < 0.5 ? ' short-description' : '') + '">';
        rows += '<td>' + formattedDate + '</td>';
        rows += '<td>' + entry.person_name + '</td>';
        rows += '<td>' + entry.project_name + '</td>';
        rows += '<td><div class="time-hours">' + hours + '</div></td>';
        rows += '<td><div class="time-rate">$' + rate.formatMoney(2, '.', ',') + '</div></td>';
        rows += '<td>($' + pay_rate.formatMoney(2, '.', ',') + ')</td>';
        rows += '<td>$' + billable.formatMoney(2, '.', ',') + '</td>';
        rows += '<td class="description-cell"><div class="sentences-per-hour">' + sentencesPerHour.toFixed(1) + '</div> ' + nl2br(entry.description) + '</td>';
        rows += '<td><div class="time-invoiced">' + (entry.invoice_line_item_id ? '⎘' : '') + '</div></td>';
        rows += '</tr>';

        totalHours += hours;
        totalBillable += billable;
        totalGrossBillable += grossBillable;
        if (!entry.invoice_line_item_id) {
          totalUninvoicedNow += billable;
        }

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

      var workDays = workingDaysBetweenDates(startDate, endDate),
          totalBreakEven = workDays * breakEvenWeekday,
          totalGoal = workDays * goalWeekday,
          totalDiff = totalBillable - totalBreakEven,
          totalDiffClass = totalDiff > 0 ? "profit" : "loss";

      $target.find('.total-hours').html(totalHours);
      $target.find('.total-billable').html('$' + totalBillable.formatMoney(2, '.', ','));
      $target.find('.average-hourly-rate').html('$' + (totalGrossBillable / totalHours).formatMoney(2, '.', ','));
      $target.find('.total-uninvoiced-now').html('$' + totalUninvoicedNow.formatMoney(2, '.', ','));
      $target.find('.cashboard-billable-table tbody').html(rows);

      $target.find('.total-break-even').html('($' + totalBreakEven.formatMoney(2, '.', ',') + ')');
      $target.find('.total-goal').html('($' + totalGoal.formatMoney(2, '.', ',') + ')');

      $target.find('.cashboard-billable-summary').removeClass('profit loss').addClass(totalDiffClass).find('h2').html('<span class="' + totalDiffClass + '">$' + Math.abs(totalDiff).formatMoney(2, '.', ',') + '</span>');
      if (today > startDate && today < endDate) {
        var workDaysToday = workingDaysBetweenDates(startDate, today),
            breakEvenToday = workDaysToday * breakEvenWeekday,
            diffToday = totalBillable - breakEvenToday,
            diffTodayClass = diffToday > 0 ? "profit" : "loss";
        if (breakEvenToday < totalBreakEven) {
          $target.find('.cashboard-billable-summary').addClass(diffTodayClass).find('h2').prepend('<span class="' + diffTodayClass + '">$' + Math.abs(diffToday).formatMoney(2, '.', ',') + ' <small>(today)</small></span> / ');
        }
      }

    } else {
      var msg = '<div class="alert alert-error" title="No results">No results</div>';
      $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=8>' + msg + '</td></tr>');
      $target.find('.cashboard-billable-summary-table td').html(msg);
      $target.find('.cashboard-billable-table .loading.large, .cashboard-billable-summary-table .loading.large').hide();
      $target.find('.cashboard-billable-summary').removeClass('profit loss').find('h2').html(msg);
    }

    if (data.results.invoices && data.results.invoices.length > 0) {
      var invoiceRows = "";
      $.each(data.results.invoices, function(i, invoice) {
        var invoicedAt = new Date(invoice.invoice_date),
            invoicedDate =  invoicedAt.getDate(),
            invoicedMonth = invoicedAt.getMonth(), //Months are zero based
            invoicedYear =  invoicedAt.getFullYear()
            formattedInvoicedDate = invoicedYear + "-" + (invoicedMonth + 1) + "-" + invoicedDate,
            dueAt = new Date(invoice.due_date),
            dueDate = dueAt.getDate(),
            dueMonth = dueAt.getMonth(), //Months are zero based
            dueYear = dueAt.getFullYear()
            formattedDueDate = dueYear + "-" + (dueMonth + 1) + "-" + dueDate,
            total = parseFloat(invoice.total),
            balance = parseFloat(invoice.balance);

        invoiceRows += '<tr>'
        invoiceRows += '<td>' + formattedInvoicedDate + '</td>';
        invoiceRows += '<td><a target="_blank" href="' + invoice.link + '">' + invoice.assigned_id + '</a></td>';
        invoiceRows += '<td>' + invoice.client_name + '</td>';
        invoiceRows += '<td>$' + total.formatMoney(2, '.', ',') + '</td>';
        invoiceRows += '<td>$' + balance.formatMoney(2, '.', ',') + '</td>';
        invoiceRows += '<td>' + (invoice.has_been_sent ? '✓' : '') + '</td>';
        invoiceRows += '<td>' + formattedDueDate + '</td>';
        invoiceRows += '</tr>';

        totalInvoiced += total;

        group(invoicesByCustomer, invoice.client_name, total)
      });

      $target.find('.invoiced').html('$' + totalInvoiced.formatMoney(2, '.', ','));
      $target.find('.cashboard-invoices-table tbody').html(invoiceRows);

    } else {
      var msg = '<div class="alert alert-error" title="No results">No results</div>';
      $target.find('.cashboard-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
      $target.find('.cashboard-invoice-summary-table td.invoiced').html(msg);
      $target.find('.cashboard-invoices-table .loading.large, .cashboard-invoice-summary-table .invoices .loading.large').hide();
    }

    if (data.results.dueInvoices && data.results.dueInvoices.length > 0) {
      var dueInvoiceRows = "";
      $.each(data.results.dueInvoices, function(i, invoice) {
        var invoicedAt = new Date(invoice.invoice_date),
            invoicedDate =  invoicedAt.getDate(),
            invoicedMonth = invoicedAt.getMonth(), //Months are zero based
            invoicedYear =  invoicedAt.getFullYear()
            formattedInvoicedDate = invoicedYear + "-" + (invoicedMonth + 1) + "-" + invoicedDate,
            dueAt = new Date(invoice.due_date),
            dueDate = dueAt.getDate(),
            dueMonth = dueAt.getMonth(), //Months are zero based
            dueYear = dueAt.getFullYear()
            formattedDueDate = dueYear + "-" + (dueMonth + 1) + "-" + dueDate,
            total = parseFloat(invoice.total),
            balance = parseFloat(invoice.balance);

        dueInvoiceRows += '<tr>'
        dueInvoiceRows += '<td>' + formattedInvoicedDate + '</td>';
        dueInvoiceRows += '<td><a target="_blank" href="' + invoice.link + '">' + invoice.assigned_id + '</a></td>';
        dueInvoiceRows += '<td>' + invoice.client_name + '</td>';
        dueInvoiceRows += '<td>$' + total.formatMoney(2, '.', ',') + '</td>';
        dueInvoiceRows += '<td>$' + balance.formatMoney(2, '.', ',') + '</td>';
        dueInvoiceRows += '<td>' + (invoice.has_been_sent ? '✓' : '') + '</td>';
        dueInvoiceRows += '<td>' + formattedDueDate + '</td>';
        dueInvoiceRows += '</tr>';

        totalDueInvoices += total;

        group(dueInvoicesByCustomer, invoice.client_name, total)
      });

      $target.find('.due-invoices').html('$' + totalDueInvoices.formatMoney(2, '.', ','));
      $target.find('.cashboard-due-invoices-table tbody').html(dueInvoiceRows);

    } else {
      var msg = '<div class="alert alert-error" title="No results">No results</div>';
      $target.find('.cashboard-due-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
      $target.find('.cashboard-invoice-summary-table td.due-invoices').html(msg);
      $target.find('.cashboard-due-invoices-table .loading.large, .cashboard-invoice-summary-table .due-invoices .loading.large').hide();
    }

    if (data.results.payments && data.results.payments.length > 0) {
      var paymentRows = "";
      $.each(data.results.payments, function(i, payment) {
        var createdAt = new Date(payment.created_on),
            currDate = createdAt.getDate(),
            currMonth = createdAt.getMonth(), //Months are zero based
            currYear = createdAt.getFullYear()
            formattedDate = currYear + "-" + (currMonth + 1) + "-" + currDate,
            amount = parseFloat(payment.amount);

        paymentRows += '<tr>'
        paymentRows += '<td>' + formattedDate + '</td>';
        paymentRows += '<td><a target="_blank" href="' + payment.link + '">' + payment.assigned_id + '</a></td>';
        paymentRows += '<td>' + payment.client_name + '</td>';
        paymentRows += '<td>$' + amount.formatMoney(2, '.', ',') + '</td>';
        paymentRows += '<td>' + payment.notes + '</td>';
        paymentRows += '</tr>';

        totalPayments += amount;

        group(paymentsByCustomer, payment.client_name, amount)
      });

      $target.find('.payments').html('$' + totalPayments.formatMoney(2, '.', ','));
      $target.find('.cashboard-payments-table tbody').html(paymentRows);

    } else {
      var msg = '<div class="alert alert-error" title="No results">No results</div>';
      $target.find('.cashboard-payments-table tbody').html('<tr><td colspan=6>' + msg + '</td></tr>');
      $target.find('.cashboard-invoice-summary-table td.payments').html(msg);
      $target.find('.cashboard-payments-table .loading.large, .cashboard-invoice-summary-table .payments .loading.large').hide();
    }

    console.log(hoursByRate);
    console.log(hoursByProject);
    console.log(hoursByMember);
    console.log(hoursByDayByMember);
    console.log(hoursByDayByProject);
    console.log(hoursByMemberByDay);
    console.log(hoursByProjectByDay);

    generateStackedTimePlotFor(hoursByMemberByDay, $target.find('.hours-by-day-by-member'), startDate, endDate);
    generateStackedTimePlotFor(hoursByProjectByDay, $target.find('.hours-by-day-by-project'), startDate, endDate);

    generateStackedTimePlotFor(hoursByMemberByDay, $target.find('.cumulative-hours-by-day-by-member'), startDate, endDate, true);
    generateStackedTimePlotFor(hoursByProjectByDay, $target.find('.cumulative-hours-by-day-by-project'), startDate, endDate, true);

    console.log("invoices data", invoicesByCustomer, dueInvoicesByCustomer, paymentsByCustomer);

    generatePieChart(invoicesByCustomer, $target.find('.invoices-by-customer'));
    generatePieChart(dueInvoicesByCustomer, $target.find('.due-invoices-by-customer'));
    generatePieChart(paymentsByCustomer, $target.find('.payments-by-customer'));

  } else if (data.error) {
    var msg = '<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>';
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=8></td>' + msg + '</tr>');
    $target.find('.cashboard-billable-summary-table td').html(msg);
    $target.find('.cashboard-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
    $target.find('.cashboard-invoice-summary-table td.invoiced').html(msg);
    $target.find('.cashboard-payments-table tbody').html('<tr><td colspan=6>' + msg + '</td></tr>');
    $target.find('.cashboard-invoice-summary-table td.payments').html(msg);
    $target.find('.cashboard-due-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
    $target.find('.cashboard-invoice-summary-table td.due-invoices').html(msg);
    $target.find('.loading.large').hide();
  }
  var $button = $target.find('.refresh-service[data-service="cashboard_global_billable_time"]'),
      $form = $button.parents('form');
  $button.removeClass('disabled').html('<i class="icon-filter"></i>');
  $form.find('.refresh-ok').show().delay('250').fadeOut();
  $form.find('input,textarea,select').prop('readonly', false);
  $form.find('.btn').removeClass('disabled');
};
