widgets.aremysitesup_instant_status = function(data, $) {
  var $target = $('#widget-' + data.id),
      up = data.results.status == 'up',
      url = stringToUrl(data.results.link);
  if (data.error) {
    $target.find('.aremysitesup-status').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving status</div>');
  } else {
    var out = "";
    out += (up ? '<div class="alert alert-success">' : '<div class="alert alert-error">');
    out += url.host + ' is ' + data.results.status;
    out += (up ? ' <i class="icon-thumbs-up"></i>' : ' <i class="icon-exclamation-sign"></i>');
    $target.find('.aremysitesup-status').html(out);
    $target.find('.refresh-service[data-service="aremysitesup_instant_status"]').removeClass('disabled').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
