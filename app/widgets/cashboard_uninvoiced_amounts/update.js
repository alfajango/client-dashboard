widgets.cashboard_uninvoiced_amounts = function(data, $) {
  var $target = $('#widget-' + data.id);
  if (data.error) {
    $target.find('.uninvoiced-time').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>');
    $target.find('.uninvoiced-expenses').html('');
  } else {
    $target.find('.uninvoiced-time').html('$' + data.results.invoice.formatMoney(2, '.', ','));
    $target.find('.uninvoiced-expenses').html('$' + data.results.expenses.formatMoney(2, '.', ','));
    $target.find('.refresh-service[data-service="cashboard_uninvoiced_amounts"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
