// // Middleware to filter bots based on user-agents
// app.use((req, res, next) => {
//     const userAgent = req.get('User-Agent');
//     if (userAgent && userAgent.includes('bot')) {
//       return res.status(403).send('Access forbidden for bots.');
//     }
//     next();
//   });
  