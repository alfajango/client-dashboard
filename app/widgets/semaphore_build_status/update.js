widgets.semaphore_build_status = function(data, $) {
  var $target = $('#widget-' + data.id),
      passed = data.results.status == 'passed';
  if (data.error) {
    $target.find('.semaphore-build-status').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>');
  } else {
    var out = "";
    out += (passed ? '<div class="alert alert-success">' : '<div class="alert alert-error">');
    out += data.results.project_name + ' [' + data.results.branch_name + '] test suite ' + data.results.status;
    out += (passed ? ' <i class="icon-thumbs-up"></i>' : ' <i class="icon-exclamation-sign"></i>');
    $target.find('.semaphore-build-status').html(out);
    $target.find('.refresh-service[data-service="semaphore_build_status"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
