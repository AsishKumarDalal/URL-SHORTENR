const{encode}=require("../service/service");
const { Url, Analytics } = require("../models/schema");
const Redis=require("ioredis")
const redis = new Redis(
process.env.REDIS_URI);


const makeShort=async(req,res)=>{
    const {url:longurl}=req.body;
    if (!longurl) {
        return res.status(400).json({ error: "URL is required" });
    }
    try{
        const entry=await Url.create({
            longURL:longurl,
            shortID:"",
        })
        const {id}=entry;
        const shorurl=encode(id)
        const new_entry=await entry.update({
            shortID:shorurl
        })
        await Analytics.create({
            UrlId:id,
            totalVisits:0,
        })
        await redis.set(shorurl,longurl)
        return res.json({new_entry})

    }
    catch(error){
        console.error("Error creating short URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

}
const getUrl=async(req,res)=>{
const{id}=req.params;
const cache=await redis.get(id)
if(cache)return res.send(cache);
const data = await Url.findOne({
    where: {
      shortID: id
    },
    include: Analytics
  });
  if (!data) {
    return res.status(404).json({
      message: "URL not found"
    });
  }
await data.Analytic.increment('totalVisits');
return res.send(data.longURL)

}
module.exports={makeShort,getUrl};
