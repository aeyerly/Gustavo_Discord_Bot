const ytdl = require('ytdl-core');
const {Sequelize, Op} = require('sequelize');
const sequelize = new Sequelize('eegDatabase', 'username', 'password', {
    host: 'localgost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});

const SongQueue = require('../models/SongQueue')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'skip',
    description: 'Skip a song',
    args: false,
    type: '<song>',

    async execute(message, args) {
        //Deleting first song
        const firstSong = await SongQueue.findOne();
        const songId = firstSong.id;
        await SongQueue.destroy({where: {id: songId}});

        //Getting new first song
        const nextSong = await SongQueue.findOne();

        //Leave if queue is empty
        if (!nextSong) {
            //await sleep(60000);
            return message.member.voice.channel.leave();
        }

        console.log('1');
        const connection = await message.member.voice.channel.join();
        console.log('2');
        const dispatcher = connection.play(ytdl(nextSong.url));

        //Playing next song
        dispatcher.on('finish', async () => {
            const nextSong = await SongQueue.findOne();

                if (nextSong) {
                    await this.execute(message);
                }
                
                else {
                    await sleep(60000);
                    message.member.voice.channel.leave();
                }
        })
        
        function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            })
        }
    }

    
}