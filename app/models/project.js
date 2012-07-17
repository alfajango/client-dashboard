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
  deploys:          [DeploySchema]
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

mongoose.model('Project', ProjectSchema);
