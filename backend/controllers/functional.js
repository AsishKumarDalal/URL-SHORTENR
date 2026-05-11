const{encode}=require("../service/service");
const { Url, Analytics } = require("../models/schema");

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
            urlId:id,
            totalVisits:0,
        })
        return res.json({new_entry})

    }
    catch(error){
        console.error("Error creating short URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

}
const getUrl=async(req,res)=>{
const{id}=req.params;
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
await data.Analytics.increment('totalVisits');
return res.send(data)

}
module.exports={makeShort,getUrl};
