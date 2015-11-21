var https = require('https');
var querystring = require('querystring');

exports.options = function(service, path) {
  var auth = 'Basic ' + new Buffer(service.user + ':' + service.token).toString('base64');
  return {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    path: path,
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };
};

// These will automatically populate the front-end settings form for the widget,
// where the object keys correspond to their respective form inputs.
exports.defaultSettings = {
  start_date_raw: function() {
    var d = new Date(),
        day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  },
  formatted: function(date) {
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
  },
  end_date: function() {
    var start = exports.defaultSettings.start_date_raw();
    return exports.defaultSettings.formatted(new Date(start.setDate(start.getDate() + 6)));
  },
  start_date: function() {
    return exports.defaultSettings.formatted(exports.defaultSettings.start_date_raw());
  }
}

// Fetch issues from service endpoint
exports.fetch = function(service, callback, settings) {
  var cashboard = this,
      out = {id: service.id, name: service.name},
      jsonData = {},
      startDate = settings && settings.start_date ? settings.start_date : cashboard.defaultSettings.start_date(),
      endDate = settings && settings.end_date ? settings.end_date : cashboard.defaultSettings.end_date();

  utils.when(
    function(done) {
      var path = '/time_entries.json?billable=true&start_date=' + startDate + '&end_date=' + endDate;
      cashboard.fetchAPI('timeEntries', path, service, jsonData, done);
    },
    function(done) {
      var path = '/line_items.json';
      cashboard.fetchAPI('lineItems', path, service, jsonData, done);
    },
    function(done) {
      var path = '/projects.json';
      cashboard.fetchAPI('projects', path, service, jsonData, done);
    },
    function(done) {
      var path = '/employees.json';
      cashboard.fetchAPI('employees', path, service, jsonData, done);
    },
    function(done) {
      var path = '/project_assignments.json';
      cashboard.fetchAPI('projectAssignments', path, service, jsonData, done);
    },
    function(done) {
      var path = '/client_contacts.json';
      cashboard.fetchAPI('clientContacts', path, service, jsonData, done);
    },
    function(done) {
      var path = '/client_companies.json';
      cashboard.fetchAPI('clientCompanies', path, service, jsonData, done);
    },
    function(done) {
      var path = '/invoices.json?start_date_invoice=' + startDate + '&end_date_invoice=' + endDate;
      cashboard.fetchAPI('invoices', path, service, jsonData, done);
    },
    function(done) {
      var path = '/invoices.json?start_date_due=' + startDate + '&end_date_due=' + endDate;
      cashboard.fetchAPI('dueInvoices', path, service, jsonData, done);
    },
    function(done) {
      var path = '/payments.json?start_date=' + startDate + '&end_date=' + endDate;
      cashboard.fetchAPI('payments', path, service, jsonData, done);
    }
  ).then(function() {
    var config = JSON.parse(service.config);

    out.results = cashboard.translate(jsonData, service);
    out.breakEvenDates = cashboard.breakEvenDates(startDate, endDate, config);
    out.goalDates = cashboard.goalDates(out.breakEvenDates);
    out.error = jsonData.error;
    console.log("RETURNING RESPONSE");
    callback(out);
  });

};

exports.arrFind = function(arr, test) {
  var result = null;
  arr.some(function(el, i) {
    return test.call(this, el, i, arr) ? ((result = el), true) : false;
  });
  return result;
}

exports.breakEvenDates = function(startDateStr, endDateStr, config) {
  var startDate = new Date(startDateStr + " EST"),
      endDate = new Date(endDateStr + " EST"),
      today = new Date(),
      breakEvenDates = {},
      total = 0,
      totalToday = 0;
  for (var day = startDate; day <= endDate; day.setDate(day.getDate() + 1)) {
    var key, amount;
    if ([0,6].indexOf(day.getDay()) >= 0) {
      amount = 0;
    } else {
      key = this.arrFind(Object.keys(config).reverse(), function(k) { return (new Date(k)) <= day; });
      // Divide by number of workdays in a week to distribute over workdays and not weekends.
      amount = config[key] / 5;
    }
    total = total + amount;
    if (today > day) {
      totalToday = totalToday + amount;
    }
    breakEvenDates[(day.getFullYear() + "-" + (day.getMonth() + 1) + "-" + day.getDate())] = amount;
  }
  breakEvenDates.total = total;
  breakEvenDates.totalToday = totalToday;
  return breakEvenDates;
};

exports.goalDates = function(breakEvenDates) {
  var keys = Object.keys(breakEvenDates),
      goalDates = {};
  for (var i=0; i<keys.length; i++) {
    var key = keys[i];
    goalDates[key] = breakEvenDates[key] * 1.2;
  }
  return goalDates;
};

exports.fetchAPI = function(name, path, service, jsonData, done) {
  var options = this.options(service, path);
  console.log('GETTING: ' + name);

  var req = https.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          var resData = JSON.parse(data);
          jsonData[name] = resData;
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          jsonData.error = err.message;
        }
        console.log('DONE: ' + name);
        done();
      });
    } else {
      console.log('Status code: ' + res.statusCode);
      jsonData.error = res.statusCode;
      done();
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    jsonData.error = e.message;
    done();
  });
};

// Translate fetched response to db store format
exports.translate = function(data, service) {
  var cashboard = this,
      results = {};
  if (data.timeEntries) {
    data.timeEntries.forEach(function(entry) {
      var lineItem = data.lineItems.filter(function(li) {
        return li.links.self.indexOf(entry.line_item_id) > 0;
      })[0];

      var project = data.projects.filter(function(p) {
        return p.links.self.indexOf(lineItem.project_id) > 0;
      })[0];
      entry.project_name = project.name;

      var person = data.employees.filter(function(e) {
        return e.links.self.indexOf(entry.person_id) > 0;
      })[0];
      entry.person_name = [person.first_name, person.last_name].join(' ');

      var projectAssignment = data.projectAssignments.filter(function(pa) {
        return pa.person_id === entry.person_id && pa.project_id === lineItem.project_id;
      })[0];

      if (projectAssignment) {
        if (projectAssignment.pay_rate > 0) {
          entry.pay_rate = projectAssignment.pay_rate;
        } else {
          entry.pay_rate = person.default_pay_rate;
        }
      } else {
        entry.pay_rate = 0;
      }

      if (project.billing_code === 0) {
        entry.billable_rate = 0;
      } else if (project.billing_code === 1) {
        entry.billable_rate = lineItem.price_per;
      } else if (project.billing_code === 2) {
        if (projectAssignment) {
          if (projectAssignment.bill_rate > 0) {
            entry.billable_rate = projectAssignment.bill_rate;
          } else {
            entry.billable_rate = person.default_bill_rate;
          }
        } else {
          entry.billable_rate = 0;
        }
      }
    });
    results.timeEntries = data.timeEntries;
  }
  if (data.invoices) {
    data.invoices.forEach(function(invoice) {
      invoice.client_name = cashboard.getClientName(invoice.client_type, invoice.client_id, data);
      invoice.link = 'https://' + service.user + '.cashboardapp.com/provider/invoices/show/' + invoice.assigned_id;
    });

    results.invoices = data.invoices;
  }
  if (data.dueInvoices) {
    data.dueInvoices.forEach(function(invoice) {
      invoice.client_name = cashboard.getClientName(invoice.client_type, invoice.client_id, data);
      invoice.link = 'https://' + service.user + '.cashboardapp.com/provider/invoices/show/' + invoice.assigned_id;
    });

    results.dueInvoices = data.dueInvoices;
  }
  if (data.payments) {
    data.payments.forEach(function(payment) {
      payment.client_name = cashboard.getClientName(payment.client_type, payment.client_id, data);
      payment.link = 'https://' + service.user + '.cashboardapp.com/provider/payments/show/' + payment.assigned_id;
    });
    results.payments = data.payments;
  }
  return results;
};

exports.getClientName = function(client_type, client_id, data) {
  var name,
      contactType = client_type === "Person" ? "clientContacts" : "clientCompanies",
      client = data[contactType].filter(function(c) {
        return c.id == client_id;
      })[0];

  if (client) {
    if (client_type === "Person" && client) {
      name = client.first_name + " " + client.last_name;
    } else if (client) {
      name = client.name;
    }
  }

  return name
};

// Write fetched results to db
exports.write = function() {
};
