const { Router } = require('express');
const activityHistoryRouter = Router();
const activityHistoryControllers = require('../controllers/activityHistoryControllers.js');

activityHistoryRouter.get('/', activityHistoryControllers.activityHistoryGet);
activityHistoryRouter.get('/:id', activityHistoryControllers.getItemActivityHistory);

module.exports = activityHistoryRouter;
