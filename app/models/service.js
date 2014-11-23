var ServiceSchema = new Schema({
  name:             String,
  url:              String,
  identifier:       String,
  user:             String,
  token:            String,
  config:           Schema.Types.Mixed
});

ServiceSchema.methods.fetch = function(callback, settings) {
  widgets[this.name].model.fetch(this, callback, settings);
};

ServiceSchema.methods.defaultSettings = function() {
  return widgets[this.name].model.defaultSettings;
};

mongoose.model('Service', ServiceSchema);
