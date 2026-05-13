const express = require("express");
require("dotenv").config();
const cors = require("cors");
const route=require("./routes/routes");
const app = express();
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URI);
const {flushClicksToDB}=require("./service/syncTask");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    message: "Too many links created from this IP, please try again after a minute."
});


app.use(express.json())
app.use(cors());
app.use("/api/url/shorten", limiter);
app.use("/api",route);

app.get("/",(req,res)=>{
    res.send("hlw from builder");
})
setInterval(() => {
    flushClicksToDB(redis);
}, 360000); 
app.listen(8000,()=>{
    console.log("server started on port 8000");
})
