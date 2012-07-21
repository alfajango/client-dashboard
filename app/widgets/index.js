module.exports = function(widgets) {
  return widgets.reduce( function(out, name) {
    out[name] = require("./" + name)[name];
    return out;
  }, {});
};
