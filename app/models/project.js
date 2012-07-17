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
  this.services.forEach( function(service) {
    service.fetch(callback);
  });
};

mongoose.model('Project', ProjectSchema);
