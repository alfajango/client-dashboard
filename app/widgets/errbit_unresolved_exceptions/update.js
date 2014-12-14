widgets.errbit_unresolved_exceptions = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "";
  if (data.results && data.results.length > 0) {
    $.each(data.results, function(i, exception) {
      var issueTicket = exception.issue_link.match(/\/(\d+)[$\?]/);
      rows += '<tr>';
      rows += '<td class="issue-number-column">' + (issueTicket ? issueTicket[1] : '') + '</td>';
      rows += '<td><table class="table-condensed table-no-border">';
      rows += '<tr><th>Env:</th><td>' + exception.env + '</td></tr>';
      if (exception.url && exception.url !== "{}") {
        rows += '<tr><th>URL:</th><td>' + stringToUrl(exception.url).pathname + '</td></tr>';
      }
      rows += '</table></td>';
      rows += '<td><table class="table-condensed table-no-border">';
      rows += '<tr><th>Last:</th><td>' + (exception.last_occurrence ? humaneDate(exception.last_occurrence) : '') + '</td></tr>';
      rows += '<tr><th>Total:</th><td>' + exception.count + '</td></tr>';
      rows += '</table></tr>';
    });
  } else if (data.error) {
    rows += '<tr><td colspan=4><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving unresolved errors</div></td></tr>'
  } else {
    rows += '<tr><td colspan=4><div class="alert alert-success">No unresolved errors <i class="icon-thumbs-up"></i></div></td></tr>';
  }
  $target.find('.errbit-table tbody').html(rows);
  $target.find('.errbit-title .badge')
    .html((data.results && data.results.length) || "N/A")
    .removeClass('badge-success').removeClass('badge-warning')
    .addClass(data.results && data.results.length === 0 ? 'badge-success' : 'badge-warning');
  $target.find('.refresh-service[data-service="errbit_unresolved_exceptions"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
};
