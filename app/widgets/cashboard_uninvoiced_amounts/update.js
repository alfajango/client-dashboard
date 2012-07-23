widgets.cashboard_uninvoiced_amounts = function(data, $) {
  if (data.error) {
    $('#invoice').html('<div class="alert alert-error" title="' + data.error + '">There was a problem retrieving amount</div>');
    $('#expenses').html('');
  } else {
    $('#invoice').html('$' + addCommas(data.cashboard_uninvoiced_amounts.invoice));
    $('#expenses').html('$' + addCommas(data.cashboard_uninvoiced_amounts.expenses));
    $('.refresh-service[data-service="cashboard_uninvoiced_amounts"]').removeClass('disabled').html('<i class="icon-retweet"></i>').siblings('.refresh-ok').show().delay('250').fadeOut();
  }
};
