// dependencies
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
// const logger = require("morgan");
const multer = require("multer");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const useragent = require("express-useragent");
require("dotenv").config();

// routers
const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");

// models
const Admin = require("./model/Admin");
const { getIO } = require("./io");
const { DATABASE_URL } = require("./config");

// setup constants
const MONGODB_URI = DATABASE_URL;
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
  expires: 20 * 60 * 1000,
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
});
var port = process.env.PORT || "3000";

// app
const app = express();

// multer settings
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app set
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("port", port);

// app use
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).fields([
    { name: "image_front", maxCount: 1 },
    { name: "image_back", maxCount: 1 },
    { name: "image_selfie", maxCount: 1 },
  ])
);
app.use("/images", express.static(path.join(__dirname, "images")));
// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.use(requestIp.mw());
app.use(useragent.express());

const sessionMiddleware = session({
  secret: "097b0efb-0889-4060-bb08-4dc568eadb44",
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: {
    maxAge: 15 * 60 * 1000, // 1 hour
  },
});
app.use(sessionMiddleware);

app.use("/", indexRouter);
app.use("/admin", adminRouter);

app.use((req, res, next) => {
  if (!req.session.admin) {
    return next();
  }

  Admin.findById(req.session.admin._id)
    .then((admin) => {
      req.admin = admin;
      next();
    })
    .catch((err) => {
      res.status(err.status);
      res.render("error");
    });
});

app.use((req, res, next) => {
  res.locals.isAdminLoggedIn = req.session.isAdminLoggedIn;
  res.locals.admin = req.admin;
  next();
});

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

/**
 * Listen on provided port, on all network interfaces.
 */
mongoose
  .connect(DATABASE_URL)
  .then((connection) => {
    const server = app.listen(port);
    const io = require("./io").init(server);
    const wrap = (middleware) => (socket, next) =>
      middleware(socket.request, {}, next);

    io.use(wrap(sessionMiddleware));

    // mongoose.connection
    //   .collection("sessions")
    //   .watch()
    //   .on("change", async (data) => {
    //     // detecting change successfully
    //     io.emit("sessionUpdate", {
    //       updated: true,
    //       data: data,
    //     });
    //   });

    io.on("connection", async (socket) => {
      const visitorId = socket.request.session.visitorId;

      await mongoose.connection
        .collection("sessions")
        .updateMany(
          { "session.visitorId": visitorId }, // The search query
          { $set: { "session.status": true } } // The update operation
        )
        .then((result) => {
          io.emit("session-update", {
            updated: true,
          });
        });

      socket.on("disconnect", async (reason) => {
        await mongoose.connection
          .collection("sessions")
          .updateMany(
            { "session.visitorId": visitorId }, // The search query
            { $set: { "session.status": false, "session.page": "Left" } } // The update operation
          )
          .then((result) => {
            io.emit("session-update", {
              updated: true,
            });
          });
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
