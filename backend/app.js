const express = require("express");
const cors = require("cors");
const route=require("./routes/routes");
const app = express();  

app.use(express.json())
app.use(cors());
app.use("/api",route);
app.listen(8000,()=>{
    console.log("server started on port 8000");
})
