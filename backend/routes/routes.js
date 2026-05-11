const express=require("express");
const router=express.Router();
const{makeShort,getUrl}=require("../controllers/functional");
router.post("/url/shorten",makeShort);
router.get("/url/:id",getUrl)
module.exports=router;
