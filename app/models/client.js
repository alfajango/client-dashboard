var ProjectSchema = mongoose.model('Project').schema;

var ClientSchema = new Schema({
  name:             String,
  projects:         [ProjectSchema],
  invoiceAmount:    Number,
  archived:         Boolean
},{
  usePushEach: true
});

mongoose.model('Client', ClientSchema);
