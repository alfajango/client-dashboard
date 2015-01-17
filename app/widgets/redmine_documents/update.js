$(document).delegate('.redmine-title-td', 'click', function() {
  $(this).find('.redmine-document-description').slideToggle(250);
});

widgets.redmine_documents = function(data, $) {
  var $target = $('#widget-' + data.id),
      rows = "",
      totalDocuments;
  if (data.results && data.results.length > 0) {
    totalDocuments = 0;
    $.each(data.results, function(i, category) {
      rows += '<tr class="redmine-version"><td>' + category.name + '</td></tr>';
      $.each(category.documents, function(i, doc) {
        totalDocuments++;
        rows += '<tr >';
        rows += '<td class="redmine-title-td"><div>' + doc.title + '</div><div class="redmine-document-description"><hr />' + doc.description.replace(/(?:\r\n|\r|\n)/g, '<br />'); + '</div></td>';
        rows += '</tr>';
      });
    });
  } else if (data.error) {
    rows += '<tr><td><div class="alert alert-error" title="' + data.error + '">There was a problem retrieving documents</div></td></tr>'
  } else {
    rows += '<tr><td><div class="alert alert-success">No documents</div></td></tr>';
  }
  $target.find('.redmine-documents-table tbody').html(rows);
  $target.find('.redmine-documents-title .badge').html(totalDocuments || "N/A");
  $target.find('.refresh-service[data-service="redmine_documents"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
};
