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

mongoose.model('Deploy', DeploySchema);
mongoose.model('Exception', ExceptionSchema);
mongoose.model('Status', StatusSchema);
mongoose.model('Issue', IssueSchema);
