widgets.redmine_open_issues = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "",
      now = new Date(),
      yesterday = now - (1000 * 60 * 60 * 24);
  if (data.results.length > 0) {
    $.each(data.results, function(i, issue) {
      var updated = +(new Date(issue.updated)); // Make sure both dates are compared as integers
      rows += '<tr' + (updated > yesterday ? ' class="recently-updated" rel="tooltip" title="recently active"' : '') + '>';
      rows += '<td class="issue-number-column">' + issue.id + '</td>';
      rows += '<td>' + issue.subject + '</td>';
      rows += '<td class="redmine-status-td"' + (issue.priority > 1 ? ' rel="tooltip" title="high priority"' : '') + '>';
      rows += issue.status;
      if (issue.priority > 1) {
        rows += ' <i class="icon-star-empty"></i>';
      }
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
  $target.find('.redmine-table tbody').html(rows);
  $target.find('.redmine-table tr').tooltip({placement: 'bottom'});
  $target.find('.redmine-table td').tooltip({placement: 'bottom'});
  $target.find('.redmine-title .badge').html(data.results.length);
  $target.find('.refresh-service[data-service="redmine_open_issues"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
};
