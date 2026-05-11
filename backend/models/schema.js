const { Sequelize,DataTypes } = require('sequelize');

const sequelize = new Sequelize('url_shortner', 'root', '', {
  host: 'localhost',
  //logging: false,
  dialect: "mysql"
});
const Url=sequelize.define('Url',{
    longURL:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    shortID:{
        type:DataTypes.STRING
    },
    
});
const Analytics = sequelize.define('Analytics', {
  totalVisits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});
Url.hasOne(Analytics);
Analytics.belongsTo(Url);
//sequelize.sync({ force: true });
module.exports={Url,Analytics}
