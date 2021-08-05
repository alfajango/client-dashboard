# Alfa Jango Client Dashboard

This is a dashboard for all clients to get an overview of their
project's development progress and status.


## setup

with mongo installed:

    npm install -g jake
    jake seed:users

    node app.js

will seed an admin:
user: test@example.com
password: password

## Resetting user password from the command line

If you get locked out of your account, because you can't remember your
password, for example, you can run this from the command line:

```
heroku run node
```

Then from the node command-line, you can run this:

```
require("./app").commandResetPassword("youremail@example.com", "MyNewPassword")
```
