widgets.cashboard_global_billable_time = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "";
  if (data.results && data.results.length > 0) {
    var totalHours = 0,
        totalBillable = 0;
    $.each(data.results, function(i, entry) {
      var created = new Date(entry.created_on),
          createdInt = +(created), // Make sure both dates are compared as integers
          hours = entry.minutes / 60.0,
          rate = parseFloat(entry.billable_rate),
          billable = hours * rate,
          currDate = created.getDate(),
          currMonth = created.getMonth() + 1, //Months are zero based
          currYear = created.getFullYear();
      rows += '<tr' + (entry.rate <= 0 ? ' class="zero-rate"' : '') + '>';
      rows += '<td>' + currDate + "-" + currMonth + "-" + currYear + '</td>';
      rows += '<td>' + entry.person_name + '</td>';
      rows += '<td>' + entry.project_name + '</td>';
      rows += '<td>' + hours + '</td>';
      rows += '<td>$' + rate.formatMoney(2, '.', ',') + '</td>';
      rows += '<td>$' + billable.formatMoney(2, '.', ',') + '</td>';
      rows += '<td>' + entry.description + '</td>';
      rows += '</tr>';

      totalHours += hours;
      totalBillable += billable;
    });
    rows = '<tr class="totals"><th colspan=3>Total Hours: ' + totalHours + '</th><th colspan=3>Total Billable: $' + totalBillable.formatMoney(2, '.', ',') + '</th><th colspan=1>Avg Hourly Rate: $' + (totalBillable / totalHours).formatMoney(2, '.', ',') + '</th></tr>' + rows;

    $target.find('.cashboard-billable-table tbody').html(rows);
  } else if (data.error) {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div></td></tr>');
  } else {
    $target.find('.cashboard-billable-table tbody').html('<tr><td colspan=7><div class="alert alert-error" title="No results">No results</div></td></tr>');
  }
  $target.find('.refresh-service[data-service="cashboard_global_billable_time"]').removeClass('disabled').html('<i class="icon-filter"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
