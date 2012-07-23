widgets.redmine_open_issues = function(data, $) {
  var rows = "";
  var now = new Date(),
      yesterday = now - (1000 * 60 * 60 * 24);
  if (data.redmine_open_issues.length > 0) {
    $.each(data.redmine_open_issues, function(i, issue) {
      var updated = +(new Date(issue.updated)); // Make sure both dates are compared as integers
      rows += '<tr' + (updated > yesterday ? ' class="recently-updated" rel="tooltip" title="recently active"' : '') + '>';
      rows += '<td>' + issue.id + '</td>';
      rows += '<td>' + issue.subject + '</td>';
      rows += '<td class="redmine-status-td">' + issue.status;
      if (issue.progress > 0) {
        rows += '<div class="progress progress-striped"><div class="bar" style="width: ' + issue.progress + '%;"></div>'
      }
      rows += '</td>';
      rows += '</tr>';
    });
  } else if (data.error) {
    rows += '<tr><td colspan=3><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving tasks</div></td></tr>'
  } else {
    rows += '<tr><td colspan=3><div class="alert alert-success">No current tasks</div></td></tr>';
  }
  $('#redmine tbody').html(rows);
  $('#redmine tr').tooltip({placement: 'bottom'});
  $('#redmine-title .badge').html(data.redmine_open_issues.length);
  $('.refresh-service[data-service="redmine_open_issues"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
