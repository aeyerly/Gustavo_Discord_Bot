const ytdl = require('ytdl-core');
const yts = require('yt-search')
const {Sequelize, Op} = require('sequelize')
const sequelize = new Sequelize('eegDatabase', 'username', 'password', {
    host: 'localgost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});
const skip = require('./skip.js');
const Discord = require('discord.js');
const SongQueue = require('../models/SongQueue')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'p',
    description: 'Play a song',
    args: true,
    type: '<song>',

    async execute(message, args) {

        //Song added embed
        const infoEmbed = new Discord.MessageEmbed().setTitle('Song Added');

        //Channel that requester is in
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.channel.send('You must be in a VC to play music');
        }

        //Get name of song to search for
        let searchTerm = '';
        for (i = 0; i < args.length; i++) {
            searchTerm += args[i];
            searchTerm += ' ';
        }

        //Search yt for vid
        const result = await yts(searchTerm);

        //Take the first result
        const video = result.videos.slice(0, 1);
        
        //Get url of video
        const songInfo = await ytdl.getInfo(video[0].url)

        //Unable to find song
        if (!songInfo) {
            return message.channel.send('Sorry, I couldn\'t find that song');
        }

        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        }
    
        //Songs are already in queue
        const topSong = await SongQueue.findOne()
        if (topSong) {
            //Add song to queue and display position number
            await SongQueue.create({songTitle: song.title, url: song.url, requestedBy: message.author.id});
            const queueLength = await SongQueue.count();
            infoEmbed.addField(`Added to queue in position ${queueLength}`, `${song.title}`);
            return message.channel.send(infoEmbed);
        }

        //No songs in queue yet, join vc and play song
        else {
            await SongQueue.create({songTitle: song.title, url: song.url, requestedBy: message.author.id});

            //Join vc and play song
            const connection = await message.member.voice.channel.join();
            const dispatcher = connection.play(ytdl(song.url));
            infoEmbed.addField(`Added to queue in position 1`, `${song.title}`);
            message.channel.send(infoEmbed)

            //Song finished, play next song
            dispatcher.on('finish', async () => { 
                await skip.execute(message);
            })
        }
    }
}