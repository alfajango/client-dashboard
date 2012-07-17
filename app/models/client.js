var ProjectSchema = mongoose.model('Project').schema;

var ClientSchema = new Schema({
  name:             String,
  projects:         [ProjectSchema],
  invoiceAmount:    Number
});

mongoose.model('Client', ClientSchema);
