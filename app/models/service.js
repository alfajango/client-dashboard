import mongoose from 'mongoose';

var ServiceSchema = new mongoose.Schema({
  name:             String,
  url:              String,
  identifier:       String,
  user:             String,
  token:            String,
  config:           mongoose.Schema.Types.Mixed
});

ServiceSchema.methods.fetch = function(callback, settings) {
  widgets[this.name].model.fetch(this, callback, settings);
};

ServiceSchema.methods.defaultSettings = function() {
  return widgets[this.name].model.defaultSettings;
};

ServiceSchema.methods.proxies = function() {
  return widgets[this.name].model.proxies;
};

mongoose.model('Service', ServiceSchema);
