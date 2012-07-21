var ServiceSchema = new Schema({
  name:             String,
  url:              String,
  identifier:       String,
  user:             String,
  token:            String
});

ServiceSchema.methods.fetch = function(callback) {
  widgets[this.name].model.fetch(this, callback);
};

mongoose.model('Service', ServiceSchema);
