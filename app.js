var createError = require("http-errors");
var express = require("express");
var mongoose = require("mongoose");
var dotenv = require("dotenv");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");

var apiRouter = require("./routes/api/index");
// var uploadRouter = require('./routes/upload/index')
var uploadRouter = require("./routes/upload/upload_index");

var app = express();

dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV == "production" ? ".env" : ".env.dev"
  ),
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
// app.set('view engine', 'ejs');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.mongourl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully Connected to Mongodb"))
  .catch((e) => console.error(e));

app.use("/", indexRouter);
// app.use('/users', usersRouter);

app.use("/api", apiRouter);
app.use("/upload", uploadRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
