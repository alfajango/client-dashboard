var http = require('http'),
    textile = require('textile-js');

exports.fetch = function(service, callback) {
  var redmine = this,
      jsonData = {},
      out = {id: service.id, name: service.name};

  utils.when(
    function(done) {
      var path = '/projects/' + service.identifier + '/documents.json';
      redmine.fetchAPI('documents', path, service, jsonData, done);
    }
  ).then(function() {
    out.results = redmine.translate(jsonData, service);
    out.error = jsonData.error;
    callback(out)
  });
};

// Fetch issues from service endpoint
exports.fetchAPI = function(name, path, service, jsonData, done) {
  var redmine = this;

  var options = {
    host: service.url,
    port: 80,
    path: path,
    headers: {
      'Accept': 'application/json',
      'X-Redmine-API-Key': service.token
    }
  };

  var req = http.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
        var resData = JSON.parse(data);
        jsonData[name] = resData[name];
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
  var categoryIds = [], categories = [];

  if (data.documents) {
    data.documents.forEach(function(x) {
      // Redmine description uses > for blockquote instead of standard textile bq. formatting.
      var description, doc;
      if (x.description && x.description !== "") {
        description = textile(
          x.description
            .replace(/{{video\(https?:\/\/(www\.)?youtu(be\.com|\.be)\/(watch\?.*v=)?([-\d\w]+)[^}]*}}/, '<iframe width="420" height="315" src="//www.youtube-nocookie.com/embed/$4?rel=0" frameborder="0" allowfullscreen></iframe>')
            .replace(/!(\/[^\s]+)!/gm, "!http://" + service.url + "$1!")
            .replace(/((^>.*$(\r\n)?)+)/gm, "<blockquote>$1</blockquote>")
            .replace(/^(<blockquote>)?> +$/gm, "$1&nbsp;")
            .replace(/^(<blockquote>)?>/gm, "$1")
        );
      } else {
        description = "<p><em>No description</em></p>";
      }

      doc = { id: x.id, title: x.title, category: x.category.name, created: new Date(x.created_on), updated: new Date(x.updated_on), description: description };

      var categoryIndex = categoryIds.indexOf(x.category.id);
      if (categoryIndex !== -1) {
        categories[categoryIndex].documents.push(doc);
      } else {
        categoryIds.push(x.category.id);
        categories.push( {id: x.category.id, name: x.category.name, documents: [doc]} );
      }
    });

    categories.forEach(function(category) {
      category.documents.sort(function(a, b) {
        return (a.title < b.title ? -1 : (a.title > b.title ? 1 : 0));
      });
    });
  }
  return categories;
};

// Write fetched results to db
exports.write = function() {
};
