widgets.errbit_unresolved_exceptions = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "";
  if (data.results.length > 0) {
    $.each(data.results, function(i, exception) {
      rows += '<tr>';
      rows += '<td>' + exception.env + '<br />';
      rows += (exception.url && exception.url !== "{}" ? stringToUrl(exception.url).pathname : 'n/a') + '</td>';
      rows += '<td>' + exception.count + '</td>';
      rows += '<td>' + (humaneDate(exception.last_occurrence) || exception.last_occurrence) + '</td>';
      rows += '</tr>';
    });
  } else if (data.error) {
    rows += '<tr><td colspan=4><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving errors</div></td></tr>'
  } else {
    rows += '<tr><td colspan=4><div class="alert alert-success">No unresolved errors <i class="icon-thumbs-up"></i></div></td></tr>';
  }
  $target.find('.errbit-table tbody').html(rows);
  $target.find('.errbit-title .badge')
    .html(data.results.length)
    .removeClass('badge-success').removeClass('badge-warning')
    .addClass(data.results.length === 0 ? 'badge-success' : 'badge-warning');
  $target.find('.refresh-service[data-service="errbit_unresolved_exceptions"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
