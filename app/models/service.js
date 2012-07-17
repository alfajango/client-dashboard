var services = require("./services");

var ServiceSchema = new Schema({
  name:             String,
  url:              String,
  identifier:       String,
  token:            String
});

ServiceSchema.methods.fetch = function(callback) {
  services[this.name].fetch(this, callback);
};

mongoose.model('Service', ServiceSchema);
