const slideDuration = 100;

function toggle(el, collapseAll) {
  let $this = $(el);
  let $description = $this.find('.redmine-description');
  let subTicketRowSelector = '#' + $this.parent('.issue-row').data('sub-ticket-row');
  let $subTicketRow = $(subTicketRowSelector);
  if ($description.is(':visible') || collapseAll) {
    $this.removeClass('expanded');
    $description.slideUp(slideDuration);
    $subTicketRow.find('> td > .redmine-sub-ticket-container').slideUp(slideDuration);
    setTimeout(function() {
      $subTicketRow.hide();
    }, slideDuration);
  } else {
    $this.addClass('expanded');
    $description.slideDown(slideDuration);
    $subTicketRow.show().find('> td > .redmine-sub-ticket-container').slideDown(slideDuration);
  }
}

var selectedVersion;

$(document).delegate('.redmine-subject-td', 'click', function(e) {
  e.stopPropagation();
  toggle(this);
});
$(document).delegate('.redmine-subject-td .redmine-description a', 'click', function(e) {
  e.stopPropagation();
});
$(document).delegate('.redmine-collapse-all', 'click', function(e) {
  e.preventDefault();
  $(document).find('.redmine-subject-td.expanded').each(function(i, el) {
    toggle(el, true);
  })
});
$(document).delegate('.redmine-target-version', 'change', function(e) {
  var $this = $(this);
  selectedVersion = $this.val();
  $this.closest('.redmine-open-issues').find('.refresh-service').click();
});
$(document).delegate('.redmine-include-closed', 'change', function(e) {
  $(this).closest('.redmine-open-issues').find('.refresh-service').click();
});

//var filterIssues = function(beginDate) {
  //$('.issue-row').each(function(i, el) {
    //var row = $(el);
    //var date = new Date(row.attr('sprint-date'));
    //if (date < beginDate) {
      //row.css("display", "none");
    //} else {
      //row.css("display", "table-row");
    //}
  //});

  //$('.redmine-title .badge').html(
    //$('.redmine-table .issue-row[style="display: table-row;"]')
      //.not('.redmine-version')
      //.length
  //);
//};

//$(document).delegate('#begin-date', 'change', function() {
  //filterIssues(new Date($(this).val()));
//});

widgets.redmine_open_issues = function(data, $) {
  var $target = $('#widget-' + data.id),
      versionOptionsHtml = '<option></option>',
      rows = "",
      now = new Date(),
      yesterday = now - (1000 * 60 * 60 * 24),
      totalIssues,
      renderIssueRow = function(issue, version) {
        totalIssues++;
        var updated = +(new Date(issue.updated)); // Make sure both dates are compared as integers
        const recentlyUpdated = updated > yesterday;
        const issueDone = issue.progress === 100 || ["Pushed to Production", "Accepted", "Done"].includes(issue.status);
        let issueRowClass = "";
        const subTicketRowId = "redmine-sub-ticket-row-" + issue.id;
        if (recentlyUpdated) {
          issueRowClass += " recently-updated";
        }
        if (issueDone) {
          issueRowClass += " done";
        }
        rows += '<tr class="issue-row' + issueRowClass + '"' +
          (recentlyUpdated ? ' rel="tooltip" title="recently active"' : '') +
          ' sprint-date="' + version.due_date + '" data-sub-ticket-row="' + subTicketRowId + '">';
        rows += '<td class="redmine-ticket-td">' + [issue.link || '#' + issue.id, issue.custom_link].filter(function(value) { return !!value }).join(' ') + '</td>';
        rows += '<td class="redmine-subject-td">'
        rows += '<div><span class="redmine-issue-subject">' + (recentlyUpdated ? '&#9679; ' : '') + issue.subject + '</span>';
        if (issue.issues.length > 0) {
          rows += ' <small>- <span>' + issue.issues.length + ' sub-tickets <span class="sub-ticket-right-arrow">&rtrif;</span><span class="sub-ticket-down-arrow">&dtrif;</span></span></small>';
        }
        rows += '</div><div class="redmine-description"><hr />' + issue.description + '</div>';
        rows += '</td>';
        let statusClass = "redmine-status-td";
        if (issue.parentId && issue.progress > 0) {
          statusClass += " has-progress";
        }
        rows += '<td class="' + statusClass + '">';
        rows += issue.status;
        // Only show this progress bar if it's a child issue, otherwise show larger progress row
        if (issue.parentId && issue.progress > 0) {
          let progressClass = "progress progress-striped"
          if (issueDone) {
            progressClass += " progress-success";
          }
          rows += '<div class="' + progressClass + '"><div class="bar" style="width: ' + issue.progress + '%;"></div>'
        }
        rows += '</td>';
        rows += '<td class="redmine-priority-td"' + (issue.priority > 1 ? ' rel="tooltip" title="high priority"' : '') + '>';
        if (issue.priority > 1) {
          rows += '&star;';
        }
        rows += issue.priorityName
        rows += '</td>';
        rows += '</tr>';
        // Only show this progress row if it's a top-level issue, otherwise show smaller progress bar
        if (!issue.parentId) {
          rows += '<tr class="issue-progress' + issueRowClass + '"><td colspan=4><progress rel="tooltip" title="' + issue.progress + '% done" class="issue-progress-bar" max="100" value="' + issue.progress + '"></progress></td></tr>';
        }
        if (issue.issues.length > 0) {
          let title = issue._catchAll ? "Sub-tickets with parent outside of filter" : '↳  Sub-tickets for <em>#' + issue.id + ': ' + issue.subject + '</em>';
          rows += '<tr class="redmine-sub-ticket-row" id="' + subTicketRowId + '"><td colspan=4 class="redmine-has-sub-tickets">';
          rows += '<div class="redmine-sub-ticket-container">';
          rows += '<table class="table table-bordered redmine-nested-issues">';
          rows += '<tr class="redmine-sub-tickets issue-row"><th colspan=4>' + title + '</th></tr>';
          issue.issues.forEach(function(childIssue) {
            renderIssueRow(childIssue, totalIssues, yesterday, version, rows);
          });
          rows += '</table>';
          rows += '</div>';
          rows += '</td></tr>';
        }
      };

  if (data.error) {
    rows += '<tr><td colspan=4><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving tasks</div></td></tr>'
  } else if (data.results && data.results.versions && data.results.versions.length > 0) {
    totalIssues = 0;
    let versionsWithIssues = [];

    $.each(data.results.versions, function(i, version) {
      if (version.status === "closed" || version.issues.length === 0) {
        return true;
      }

      rowTitle = version.name
      if (version.due_date != undefined) {
        rowTitle += " - " + (new Date(version.created_on)).toLocaleDateString();
        rowTitle += " to " + (new Date(version.due_date)).toLocaleDateString();
      }
      rows += '<tr class="redmine-version issue-row" sprint-date="' +
        version.due_date + '"><th colspan=4>' + rowTitle + '</th></tr>';

      if (version.days && version.days_progress) {
        rows += '<tr class="version-progress"><td colspan=4><progress rel="tooltip" title="' + version.days_progress + ' days in" class="version-progress-bar" max="' + version.days +'" value="' + version.days_progress + '"></progress></td></tr>';
      }

      if (version.issues.length) {
        versionsWithIssues.push(version);
        $.each(version.issues, function(i, issue) {
          renderIssueRow(issue, version);
        });
      }
    });

    $.each(data.results.versions, function(i, version) {
      versionOptionsHtml += '<option value="' + version.id + '"';

      if (selectedVersion && selectedVersion == version.id) {
        versionOptionsHtml += ' selected="selected"';
      } else if (versionsWithIssues.length === 1 && versionsWithIssues[0].id === version.id) {
        versionOptionsHtml += ' selected="selected"';
      }

      versionOptionsHtml += '>' + version.name + '</option>';
    });

  } else {
    rows += '<tr class="issue-row" sprint-date="' + version.due_date + '"><td colspan=4><div class="alert alert-success">No open tasks</div></td></tr>';
  }

  $target.find('.redmine-target-version').html(versionOptionsHtml);
  $target.find('.redmine-table tbody').html(rows);
  $target.find('.redmine-table tr').tooltip({placement: 'bottom'});
  $target.find('.redmine-table td').tooltip({placement: 'bottom'});
  $target.find('.redmine-table progress').tooltip({placement: 'bottom'});
  $target.find('.redmine-title .badge').html(totalIssues || "N/A");
  $target.find('.refresh-service[data-service="redmine_open_issues"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
  //filterIssues(new Date());
};
