$(document).delegate('.redmine-subject-td', 'click', function() {
  $(this).find('.redmine-description').slideToggle(250);
});

var filterIssues = function(beginDate) {
  $('.issue-row').each(function(i, el) {
    var row = $(el);
    var date = new Date(row.attr('sprint-date'));
    if (date < beginDate) {
      row.css("display", "none");
    } else {
      row.css("display", "table-row");
    }
  });

  $('.redmine-title .badge').html(
    $('.issue-row[style="display: table-row;"]')
      .not('redmine-version')
      .length
  );
};

$(document).delegate('#begin-date', 'change', function() {
  filterIssues(new Date($(this).val()));
});

widgets.redmine_open_issues = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "",
      now = new Date(),
      yesterday = now - (1000 * 60 * 60 * 24),
      totalIssues;
  if (data.error) {
    rows += '<tr><td colspan=4><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving tasks</div></td></tr>'
  } else if (data.results && data.results.versions && data.results.versions.length > 0) {
    totalIssues = 0;
    $.each(data.results.versions, function(i, version) {
      if (version.status === "closed" || version.issues.length === 0) {
        return true;
      }

      rows += '<tr class="redmine-version issue-row" sprint-date="' +
        version.due_date + '"><td colspan=4>' +
        version.name + '</td></tr>';

      $.each(version.issues, function(i, issue) {
        totalIssues++;
        var updated = +(new Date(issue.updated)); // Make sure both dates are compared as integers
        rows += '<tr' + (updated > yesterday ? ' class="issue-row recently-updated" rel="tooltip" title="recently active"' : ' class="issue-row"') +
          ' sprint-date="' + version.due_date + '">';
        rows += '<td class="issue-number-column">' + issue.id + '</td>';
        rows += '<td class="redmine-subject-td"><div>' + issue.subject + '</div><div class="redmine-description"><hr />' + issue.description.replace(/(?:\r\n|\r|\n)/g, '<br />'); + '</div></td>';
        rows += '<td class="redmine-status-td">';
        rows += issue.status;
        if (issue.progress > 0) {
          rows += '<div class="progress progress-striped"><div class="bar" style="width: ' + issue.progress + '%;"></div>'
        }
        rows += '</td>';
        rows += '<td class="redmine-priority-td"' + (issue.priority > 1 ? ' rel="tooltip" title="high priority"' : '') + '>';
        if (issue.priority > 1) {
          rows += ' <i class="icon-star-empty"></i>';
        }
        rows += issue.priorityName
        rows += '</td>';
        rows += '</tr>';
      });
    });
  } else {
    rows += '<tr class="issue-row" sprint-date="' + version.due_date + '"><td colspan=4><div class="alert alert-success">No open tasks</div></td></tr>';
  }
  $target.find('.redmine-table tbody').html(rows);
  $target.find('.redmine-table tr').tooltip({placement: 'bottom'});
  $target.find('.redmine-table td').tooltip({placement: 'bottom'});
  $target.find('.redmine-title .badge').html(totalIssues || "N/A");
  $target.find('.refresh-service[data-service="redmine_open_issues"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
  filterIssues(new Date());
};
