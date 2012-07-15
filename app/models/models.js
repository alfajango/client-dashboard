module.exports = function(app) {

  var schemas = {
    Deploy: new Schema({
      createdAt:       Date,
      environment:      String,
      commitSha:       String,
      changes:          String
    }),

    Exception: new Schema({
      title:            String,
      affecting:        String,
      occurrences:      Number
    }),

    Status: new Schema({
      createdAt:       Date,
      lastCheckedAt:  Date,
      state:            String,
      type:             String
    }),

    Issue: new Schema({
      number:           Number,
      title:            String,
      status:           String,
      deployId:        ObjectId,
      progress:         Number
    }),

    Project: new Schema({
      name:             String,
      issues:           [this.Issue],
      url:              String,
      statuses:         [this.Status],
      exceptions:       [this.Exception],
      deploys:          [this.Deploy]
    }),

    Client: new Schema({
      name:             String,
      projects:         [this.Project],
      invoiceAmount:    Number
    })
  };

  for(var model in schemas) {
    mongoose.model(model, schemas[model]);
  }

};
