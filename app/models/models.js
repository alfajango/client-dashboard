import mongoose from 'mongoose';

var DeploySchema = new mongoose.Schema({
  createdAt:        Date,
  environment:      String,
  commitSha:        String,
  changes:          String
});

var ExceptionSchema = new mongoose.Schema({
  title:            String,
  affecting:        String,
  occurrences:      Number
});

var StatusSchema = new mongoose.Schema({
  createdAt:        Date,
  lastCheckedAt:    Date,
  state:            String,
  type:             String
});

var IssueSchema = new mongoose.Schema({
  number:           Number,
  title:            String,
  status:           String,
  deployId:         mongoose.Schema.ObjectId,
  progress:         Number
});

mongoose.model('Deploy', DeploySchema);
mongoose.model('Exception', ExceptionSchema);
mongoose.model('Status', StatusSchema);
mongoose.model('Issue', IssueSchema);
