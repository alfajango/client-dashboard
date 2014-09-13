widgets.cashboard_global_receivable = function(data, $) {
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

  function generatePieChart(data, $target) {
    plotData = $.map(data, function(value, key) {
      return {label: key, data: value};
    });
    console.log("plotting pie", data, plotData);

    $.plot($target, plotData, {
      series: {
        pie: {
          show: true,
          label: {
            formatter: function (label, slice) {
              return "<div style='font-size:x-small;text-align:center;padding:2px;color:" + slice.color + ";'>" + label + "<br/>" + slice.data[0][1].formatMoney(2, '.', ',') + "</div>";
            }
          },
          combine: {
            color: '#999',
            threshold: 0.03
          }
        }
      },
      legend: {
        show: false
      }
    });
  }

  var $target = $('#widget-' + data.id);
  if (data.error) {
    $target.find('.uninvoiced-time').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>');
    $target.find('.uninvoiced-expenses').html('');
  } else {
    var invoiceRows = "",
        projectRows = "",
        uninvoicedTimeTotal = 0,
        uninvoicedExpenseTotal = 0
        unpaidInvoiceTotal = 0,
        unpaidDueInvoiceTotal = 0,
        uninvoicedByProject = {},
        unpaidByCustomer = {};

    if (data.results) {
      if (data.results.uninvoicedProjects && data.results.uninvoicedProjects.length) {
        $.each(data.results.uninvoicedProjects, function(i, project) {
          var uninvoicedTime = parseFloat(project.uninvoiced_item_cost),
              uninvoicedExpense = parseFloat(project.uninvoiced_expense_cost);
          projectRows += '<tr>';
          projectRows += '<td><a target="_blank" href="' + project.link + '">' + project.name + '</a></td>';
          projectRows += '<td>' + uninvoicedTime.formatMoney(2, '.', ',') + '</td>';
          projectRows += '<td>' + uninvoicedExpense.formatMoney(2, '.', ',') + '</td>';
          projectRows += '</tr>';

          uninvoicedTimeTotal += uninvoicedTime;
          uninvoicedExpenseTotal += uninvoicedExpense;

          group(uninvoicedByProject, project.name, uninvoicedTime + uninvoicedExpense);
        });

        $target.find('.uninvoiced-time').html('$' + uninvoicedTimeTotal.formatMoney(2, '.', ','));
        $target.find('.uninvoiced-expenses').html('$' + uninvoicedExpenseTotal.formatMoney(2, '.', ','));
        $target.find('.cashboard-projects-table tbody').html(projectRows);

        generatePieChart(uninvoicedByProject, $target.find('.uninvoiced-by-project'));
      } else {
        var msg = '<div class="alert alert-error" title="No results">No results</div>';
        $target.find('.uninvoiced-time').html(msg);
        $target.find('.uninvoiced-expenses').html(msg);
        $target.find('.cashboard-projects-table tbody').html('<tr><td colspan=3>' + msg + '</td></tr>');
      }

      if (data.results.unpaidInvoices && data.results.unpaidInvoices.length) {
        $.each(data.results.unpaidInvoices, function(i, invoice) {
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
              balance = parseFloat(invoice.balance),
              now = new Date();

          invoiceRows += '<tr' + (dueAt < now ? ' class="zero-rate"' : '') + '>';
          invoiceRows += '<td>' + formattedInvoicedDate + '</td>';
          invoiceRows += '<td><a target="_blank" href="' + invoice.link + '">' + invoice.assigned_id + '</a></td>';
          invoiceRows += '<td>' + invoice.client_name + '</td>';
          invoiceRows += '<td>$' + total.formatMoney(2, '.', ',') + '</td>';
          invoiceRows += '<td>$' + balance.formatMoney(2, '.', ',') + '</td>';
          invoiceRows += '<td>' + (invoice.has_been_sent ? '✓' : '') + '</td>';
          invoiceRows += '<td>' + formattedDueDate + '</td>';
          invoiceRows += '</tr>';

          unpaidInvoiceTotal += total;
          if (dueAt < now) {
            unpaidDueInvoiceTotal += total;
          }

          group(unpaidByCustomer, invoice.client_name, total);
        });

        $target.find('.unpaid-invoices').html('$' + unpaidInvoiceTotal.formatMoney(2, '.', ','));
        $target.find('.unpaid-due-invoices').html('$' + unpaidDueInvoiceTotal.formatMoney(2, '.', ','));
        $target.find('.cashboard-unpaid-invoices-table tbody').html(invoiceRows);

        generatePieChart(unpaidByCustomer, $target.find('.unpaid-by-customer'));
      } else {
        var msg = '<div class="alert alert-error" title="No results">No results</div>';
        $target.find('.unpaid-invoices').html(msg);
        $target.find('.unpaid-due-invoices').html(msg);
        $target.find('.cashboard-unpaid-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
      }

    } else {
      var msg = '<div class="alert alert-error" title="No results">No results</div>';
      $target.find('.uninvoiced-time').html(msg);
      $target.find('.uninvoiced-expenses').html(msg);
      $target.find('.unpaid-invoices').html(msg);
      $target.find('.unpaid-due-invoices').html(msg);
      $target.find('.cashboard-unpaid-invoices-table tbody').html('<tr><td colspan=7>' + msg + '</td></tr>');
      $target.find('.cashboard-projects-table tbody').html('<tr><td colspan=3>' + msg + '</td></tr>');
    }

    $target.find('.refresh-service[data-service="cashboard_global_receivable"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
