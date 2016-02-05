import mongoose from 'mongoose';

var ProjectSchema = mongoose.model('Project').schema;

var ClientSchema = new mongoose.Schema({
  name:             String,
  projects:         [ProjectSchema],
  invoiceAmount:    Number
});

mongoose.model('Client', ClientSchema);
