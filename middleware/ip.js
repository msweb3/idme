// // Dummy IP reputation list (replace with a real IP reputation service)
// const ipReputationList = new Set([
//   "1.2.3.4",
//   "5.6.7.8",
//   // Add more suspicious IPs here
// ]);

// // Middleware to filter requests from suspicious IPs using IP reputation list
// app.use((req, res, next) => {
//   const clientIp = requestIp.getClientIp(req);
//   if (ipReputationList.has(clientIp)) {
//     return res.status(403).send("Access forbidden from suspicious IP.");
//   }
//   next();
// });
