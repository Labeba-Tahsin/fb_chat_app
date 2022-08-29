require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const routes = require("./routes");
const port = process.env.PORT || 8080;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));;
routes(app);

app.listen(port, () => {
    console.log(`App is running on ${port}`);
})