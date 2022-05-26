module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      messageId: {
        field: 'message_id',
        allowNull: true,
        type: DataTypes.UUID,
      },
      sendAt: {
        field: 'send_at',
        allowNull: false,
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'UNKNOWN',
      },
      createdAt: {
        field: 'created_at',
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        field: 'updated_at',
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        field: 'deleted_at',
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      freezeTableName: true,
      tableName: 'messages',
      paranoid: true,
    }
  );

  Message.associate = function (models) {};

  return Message;
};
