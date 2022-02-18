const {Sequelize, Op} = require('sequelize');
const Discord = require('discord.js')
const sequelize = new Sequelize('eegDatabase', 'username', 'password', {
    host: 'localgost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});

const SongQueue = require('../models/SongQueue')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'q',
    description: 'Show the song queue',
    args: false,
    type: '<song>',

    async execute(message, args) {
        const queueEmbed = new Discord.MessageEmbed().setTitle('Song Queue');
        
        const songs = await SongQueue.findAll({raw: true});

        console.log(songs[0]);
        for (i = 0; i < songs.length; i++) {
            queueEmbed.addField(`${i + 1}. ${songs[i].songTitle}`, `\u200b`);
        }

        return message.channel.send(queueEmbed);
    }
}