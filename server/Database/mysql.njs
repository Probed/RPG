var MySQLPool = require("node-mysql-pool").MySQLPool;
exports.mysql = new MySQLPool({
    mysql : 'node-mysql',
    poolSize: 100,
    host: 'localhost',
    user: 'rpg_player',
    password: 'psychometallica',
    database: 'rpg'
});
