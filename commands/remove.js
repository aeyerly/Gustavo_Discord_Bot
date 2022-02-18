const {Sequelize, Op} = require('sequelize');
const sequelize = new Sequelize('eegDatabase', 'username', 'password', {
    host: 'localgost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});

const SongQueue = require('../models/SongQueue')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'remove',
    description: 'Remove a specific song',
    args: true,
    type: '<song number>',

    async execute(message, args) {
        const removeID = parseInt(args[0]) - 1;

        const songs = await SongQueue.findAll({raw: true});

        const songInfo = songs[removeID];

        SongQueue.destroy({where: {url: songInfo.url}});

        return message.channel.send(`Successfully removed song from position ${removeID}.`);
    }
}