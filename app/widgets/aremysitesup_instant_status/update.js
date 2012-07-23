widgets.aremysitesup_instant_status = function(data, $) {
  var up = data.aremysitesup_instant_status.status == 'up';
  if (data.error) {
    $('.aremysitesup-status').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving status</div>');
  } else {
    var out = "";
    out += (up ? '<div class="alert alert-success">' : '<div class="alert alert-error">');
    out += 'Site is ' + data.aremysitesup_instant_status.status;
    out += (up ? ' <i class="icon-thumbs-up"></i>' : ' <i class="icon-exclamation-sign"></i>');
    $('.aremysitesup-status').html(out);
    $('.refresh-service[data-service="aremysitesup_instant_status"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
