exports.when = function() {
  var args = arguments;  // the functions to execute first
  return {
    then: function(done) {
      var counter = 0;
      for(var i = 0; i < args.length; i++) {
        // call each function with a function to call on done
        args[i](function() {
          counter++;
          if(counter === args.length) {  // all functions have notified they're done
            done();
          }
        });
      }
    }
  };
};
