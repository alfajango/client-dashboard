var ServiceSchema = mongoose.model('Service').schema;
var IssueSchema = mongoose.model('Issue').schema;
var StatusSchema = mongoose.model('Status').schema;
var ExceptionSchema = mongoose.model('Exception').schema;
var DeploySchema = mongoose.model('Deploy').schema;

var ProjectSchema = new Schema({
  name:             String,
  services:         [ServiceSchema],
  issues:           [IssueSchema],
  url:              String,
  statuses:         [StatusSchema],
  exceptions:       [ExceptionSchema],
  deploys:          [DeploySchema],
  headerBG:         String,
  headerColor:      String,
  navbarBG:         String,
  imageURL:         String
});

ProjectSchema.methods.fetchServices = function(callback) {
  var responses = {count: 0}, services = this.services;
  var fillResponse = function(data) {
    _.extend(responses, data);
    responses.count += 1;

    // All services have run and completed
    if (responses.count == services.length) {
      callback(responses);
    }
  }

  services.forEach( function(service) {
    service.fetch(fillResponse);
  });
};

ProjectSchema.methods.serviceNames = function() {
  return this.services.map( function(x) { return x.name } );
};

ProjectSchema.methods.hasService = function(name) {
  return this.serviceNames().indexOf(name) !== -1;
};

ProjectSchema.methods.filteredServices = function(name) {
  return this.services.filter( function(service) {
    return service.name === name;
  });
};

mongoose.model('Project', ProjectSchema);
