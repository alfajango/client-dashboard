widgets.cashboard_uninvoiced_amounts = function(data, $) {
  var $target = $('#widget-' + data.id);
  if (data.error) {
    $target.find('.uninvoiced-time').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>');
    $target.find('.uninvoiced-expenses').html('');
  } else {
    $target.find('.uninvoiced-time').html('$' + addCommas(data.results.invoice));
    $target.find('.uninvoiced-expenses').html('$' + addCommas(data.results.expenses));
    $target.find('.refresh-service[data-service="cashboard_uninvoiced_amounts"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
