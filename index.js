// Bot Developed By Alex Eyerly
// Good Guy Gustavo Discord Bot

const Discord = require('discord.js');
const fs = require('fs');
const {Sequelize, Op} = require('sequelize');
const currency = new Discord.Collection();
const {Users, ItemShop, Inventory, Lottery, BlackjackGames, SongQueue} = require('./dbObjects');
const cron = require('cron');
const {prefix, token} = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

Inventory.belongsTo(ItemShop, {foreignKey: 'item_id', as: 'item'});

//Startup
client.once('ready', async() => {
    console.log('Gustavo')
    
    messageDB.sync();
    SongQueue.destroy({where:{}});
    const storedBalances = await Users.findAll();
    storedBalances.forEach(b => currency.set(b.user_id, b));
    
    midnightUpdate.start();
    constantUpdate.start();

});

//Timed Events
async function midnightJob() {
    const items = await ItemShop.findAll();
    newPopularItem = Math.floor(Math.random() * 9) + 1;

    Users.update({received: 0}, {where: {received: {[Op.gt]: 0}}})

    items.forEach(async item => {
        let mToday = item.todayBuys - item.todaySells;
        let mYesterday = item.yesterdayBuys - item.yesterdaySells;

        mPurchases = (mToday - mYesterday) / 200;
        if (item.itemId === newPopularItem) {
            mPurchases -= .2;
        }

        if (item.bonusItem === 1) {
            mPurchases += .2;
        }

        if (mPurchases >= 0) {
            if (mPurchases > .2 && item.bonusItem != 1) {
                mpurchases = .2;
            }

            newBuyPrice = Math.floor(item.cost * (1 + mPurchases));
            newSellPrice = Math.floor(newBuyPrice / 2);
        }

        else {
            if (mPurchases < -.2 && item.itemId != newPopularItem) {
                mPurchases = .2;
            } 

            newBuyPrice = Math.floor(item.cost * (1 - mPurchases));
            newSellPrice = Math.floor(newBuyPrice / 2);
        }

        if (newBuyPrice < 10) {
            newBuyPrice = 10;
            newSellPrice = 5;
        }

        ItemShop.update({yesterdayBuys: item.todayBuys}, {where: {itemName: item.itemName}});
        ItemShop.update({yesterdaySells: item.todaySells}, {where: {itemName: item.itemName}});
        ItemShop.update({todayBuys: 0}, {where: {itemName: item.itemName}});
        ItemShop.update({todaySells: 0}, {where: {itemName: item.itemName}});
        ItemShop.update({cost: newBuyPrice}, {where: {itemName: item.itemName}});
        ItemShop.update({sellPrice: newSellPrice}, {where: {itemName: item.itemName}});
    });
    const item = await ItemShop.findOne({where: {bonusItem: 1}});
    ItemShop.update({bonusItem: 0, cost: Math.floor(item.cost * 5/6), sellPrice: Math.floor(item.sellPrice * 5/6)}, {where: {bonusItem: 1}});
    ItemShop.update({bonusItem: 1}, {where: {itemId: newPopularItem}})

    popularName = await ItemShop.findOne({where: {itemId: newPopularItem}});

}

//Constantyly keep database synced
async function dbSync() {
    const storedBalances = await Users.findAll();
    storedBalances.forEach(b => currency.set(b.user_id, b));
}

let midnightUpdate = new cron.CronJob('0 * * * * *', midnightJob);
let constantUpdate = new cron.CronJob('* * * * * *', dbSync);

//Database Initialization
const sequelize = new Sequelize('eegDatabase', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'eegDatabase.sqlite',
});

//Formatting Database
const messageDB = sequelize.define('Messages', {
    name: { 
        type: Sequelize.STRING
    },
    message: Sequelize.TEXT,
});

//Setting Commands
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

//Add function to change currency amount of user
Reflect.defineProperty(currency, 'add', {
    value: async function add(user_id, amount) {
        const user = currency.get(user_id);
        if (user) {
            user.balance += Number(amount);
            return user.save();
        }

        const newUser = await Users.create({user_id: id, balance: amount});
        currency.set(id, newUser);
        return newUser;
    },
});

//Getter for a user's balance
Reflect.defineProperty(currency, 'getBalance', {
    value: function getBalance(id) {
        const user = currency.get(id);
        return user ? user.balance : 0;
    },
});

client.on('message', message => {
   
    if (message.content.startsWith(prefix)) {
        //Formatting command
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);
        
        //User did not provide arguments when command requires arguments
        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments ${message.author}! `;

            if (command.usage) {
                reply += `The correct usage for this command is \`${prefix}${command.name} ${command.usage}\``;
            }

            return message.channel.send(reply);
        }

        try {
            //Currency based commands
            if (command.type  === 'currency') {
                command.execute(message, args, currency, currency.add, currency.getBalance);
            }

            //Non-currency commands
            else {
                command.execute(message, args);
            }
        } catch (error) {
            console.error(error);
            message.reply('Something went wrong while executing that command');
        }
    } 

});

client.login(token)
