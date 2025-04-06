const { Router } = require("express");
const notificationsRouter = Router();
const notificationsControllers = require("../controllers/notificationsControllers.js");

notificationsRouter.get("/", notificationsControllers.getNotifications);

module.exports = notificationsRouter;
