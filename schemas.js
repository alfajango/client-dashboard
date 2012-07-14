module.exports = function(mongoose) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

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

    User: new Schema({
      id:               ObjectId,
      email:            String,
      salt:             String,
      hashedPassword:  String,
      invoiceAmount:   Number
    }),

    ClientService: new Schema({
      name:             String,
      uri:              String,
      token:            String
    }),

    Client: new Schema({
      name:             String,
      users:            [this.User],
      clientServices:  [this.ClientService],
      projects:         [this.Project]
    })
  };

  for(var model in schemas) {
    mongoose.model(model, schemas[model]);
  }

};
