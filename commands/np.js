const {Sequelize, Op} = require('sequelize');
const Discord = require('discord.js');
const sequelize = new Sequelize('eegDatabase', 'username', 'password', {
    host: 'localgost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});

const SongQueue = require('../models/SongQueue')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'np',
    description: 'Say what song is currently playing',
    args: false,
    type: '<song>',
    async execute(message, args) {
        
        //Embed for now playing
        const infoEmbed = new Discord.MessageEmbed().setTitle('Now Playing')

        //Get the first song in queue
        const currentSong = await SongQueue.findOne();

        //Display current song info
        if (currentSong) {
            infoEmbed.addField(`${currentSong.songTitle}`, `Requested by: `);
            return message.channel.send(infoEmbed);
        }

        //No songs in queue
        else {
            return message.channel.send('Something went wrong');
        }
    }
}