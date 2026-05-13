const { Analytics, Url } = require("../models/schema");

async function flushClicksToDB(redis) {
    // 1. Find all keys that start with "clicks:"
    console.log("flushing clicks to db");
    const keys = await redis.keys("clicks:*");

    for (const key of keys) {
        const shortID = key.split(":")[1];
        const count = await redis.get(key);

        if (count > 0) {
            // 2. Perform ONE update for the total clicks
            // This is efficient because we do it once every 5-10 minutes.
            const url = await Url.findOne({ where: { shortID } });
            if (url) {
                await Analytics.increment('totalVisits', { 
                    by: parseInt(count), 
                    where: { UrlId: url.id } 
                });
                
                // 3. Reset the count in Redis
                await redis.del(key);
            }
        }
    }
}
module.exports={flushClicksToDB}
