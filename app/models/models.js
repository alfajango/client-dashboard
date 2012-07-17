var DeploySchema = new Schema({
  createdAt:        Date,
  environment:      String,
  commitSha:        String,
  changes:          String
});

var ExceptionSchema = new Schema({
  title:            String,
  affecting:        String,
  occurrences:      Number
});

var StatusSchema = new Schema({
  createdAt:        Date,
  lastCheckedAt:    Date,
  state:            String,
  type:             String
});

var IssueSchema = new Schema({
  number:           Number,
  title:            String,
  status:           String,
  deployId:         ObjectId,
  progress:         Number
});

var ServiceSchema = new Schema({
  name:             String,
  url:              String,
  identifier:       String,
  token:            String
});

var ProjectSchema = new Schema({
  name:             String,
  services:         [ServiceSchema],
  issues:           [IssueSchema],
  url:              String,
  statuses:         [StatusSchema],
  exceptions:       [ExceptionSchema],
  deploys:          [DeploySchema]
});

var ClientSchema = new Schema({
  name:             String,
  projects:         [ProjectSchema],
  invoiceAmount:    Number
});

mongoose.model('Deploy', DeploySchema);
mongoose.model('Exception', ExceptionSchema);
mongoose.model('Status', StatusSchema);
mongoose.model('Issue', IssueSchema);
mongoose.model('Service', ServiceSchema);
mongoose.model('Project', ProjectSchema);
mongoose.model('Client', ClientSchema);
