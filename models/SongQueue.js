module.exports = (sequelize, DataTypes) => {
    return sequelize.define('song_queue', {
        songTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
        },
        length: {
            type: DataTypes.STRING,
        },
        requestedBy: {
            type: DataTypes.INTEGER,
        }
    }, {
        timestamps: false,
    });
};