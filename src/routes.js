const express = require("express");
const router = express.Router();
const controller = require("./controller");

const routes = (app) => {
    router.get("/", controller.test);
    app.post("/webhook", controller.postWebhook);
    app.post("/send-msg", controller.sendMessage);
    app.get("/webhook", controller.getWebhook);

    return app.use("/", router);
}

module.exports = routes;