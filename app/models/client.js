var ProjectSchema = mongoose.model('Project').schema;

var ClientSchema = new Schema({
  name:             String,
  projects:         [ProjectSchema],
  invoiceAmount:    Number,
  archived:         Boolean
});

mongoose.model('Client', ClientSchema);
