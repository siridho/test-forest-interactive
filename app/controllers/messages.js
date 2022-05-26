const Joi = require('@hapi/joi');
const Sequelize = require('sequelize');
const dayjs = require('dayjs');
const axios = require('axios');
const models = require('../models');
const constants = require('../constants');

const { Op } = Sequelize;
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

async function callApi({ flag, item }) {
  if (flag === 'send') {
    const { data } = await axios({
      method: 'post',
      url: `${process.env.BASE_SEND_SMS_URL}/api`,
      headers: {},
      data: {
        message: item.message,
        dnis: item.phone,
      },
    });
    await models.Message.update(
      { messageId: data.message_id },
      { where: { id: item.id } }
    );
  } else {
    const { data } = await axios({
      method: 'get',
      url: `${process.env.BASE_SEND_SMS_URL}/api?messageId=${item.messageId}`,
      headers: {},
    });
    await models.Message.update(
      { status: data.status },
      { where: { id: item.id } }
    );
  }
}

async function getAll(req, res) {
  try {
    const {
      page = 0,
      pageSize = 10,
      search = null,
      sort = {
        columnName: 'createdAt',
        sortOrder: 'ASC',
      },
      filter = null,
    } = req.body;
    const whereClause = {};
    if (search) {
      whereClause.message = { [Op.like]: `%${search}%` };
    }
    if (filter && Object.keys(filter).length > 0) {
      if (filter.startTime || filter.endTime) {
        const conditions = [];
        if (filter.startTime) {
          conditions.push({ [Op.gte]: dayjs(filter.startTime).toISOString() });
        }
        if (filter.endTime) {
          conditions.push({ [Op.lte]: dayjs(filter.endTime).toISOString() });
        }
        whereClause.sendAt = { [Op.and]: conditions };
      }
      if (filter.status) {
        whereClause.status = filter.status;
      }
    }

    const result = await models.Message.findAndCountAll({
      where: whereClause,
      order: [[sort.columnName, sort.sortOrder]],
      limit: Number(pageSize),
      offset: page * pageSize,
    });

    res.status(200).json({
      code: 200,
      status: 'success',
      message: 'list Message',
      data: {
        messages: result.rows,
        meta: {
          total: result.count,
          pageSize,
          currentPage: page,
          totalPage: Math.ceil(result.count / pageSize),
        },
      },
    });
  } catch (error) {
    res.status(401).json(error);
  }
}

async function getSent(req, res) {
  try {
    const {
      page = 0,
      pageSize = 10,
      search = null,
      sort = {
        columnName: 'createdAt',
        sortOrder: 'ASC',
      },
      filter = null,
    } = req.body;
    const whereClause = { messageId: { [Op.ne]: null } };
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    if (filter && Object.keys(filter).length > 0) {
      if (filter.startTime || filter.endTime) {
        const conditions = [];
        if (filter.startTime) {
          conditions.push({ [Op.gte]: dayjs(filter.startTime).toISOString() });
        }
        if (filter.endTime) {
          conditions.push({ [Op.lte]: dayjs(filter.endTime).toISOString() });
        }
        whereClause.sendAt = { [Op.and]: conditions };
      }
      if (filter.status) {
        whereClause.status = filter.status;
      }
    }
    const result = await models.Message.findAndCountAll({
      where: whereClause,
      order: [[sort.columnName, sort.sortOrder]],
      limit: Number(pageSize),
      offset: page * pageSize,
    });

    return res.status(200).json({
      code: 200,
      status: 'success',
      message: 'list Message',
      data: {
        messages: result.rows,
        meta: {
          total: result.count,
          pageSize,
          currentPage: page,
          totalPage: Math.ceil(result.count / pageSize),
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      status: constants.errorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }
}

async function create(req, res) {
  const joiValidation = {
    phone: Joi.string().max(15).required(),
    message: Joi.string().required(),
    sendAt: Joi.string().required(),
  };

  const { error } = Joi.validate(req.body, joiValidation);
  if (error) {
    return res.status(422).json({
      status: 'error',
      message: 'Invalid request data',
      error: error.details[0].message,
    });
  }
  const { sendAt } = req.body;
  const isValidTimestamp = dayjs(sendAt, DATE_FORMAT, true).isValid();
  if (!isValidTimestamp) {
    return res.status(422).json({
      status: 'error',
      message: 'Invalid request data',
      error: `sendAt should following this format ${DATE_FORMAT}`,
    });
  }
  try {
    const message = await models.Message.create(req.body);
    return res.status(200).json({
      code: 200,
      status: 'success',
      message: 'detail Message',
      data: message,
    });
  } catch (err) {
    // res.status(401).json(error)
    return res.status(400).json({
      code: 400,
      status: constants.errorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }
}
async function update(req, res) {
  const joiValidation = {
    phone: Joi.string().max(15).required(),
    message: Joi.string().required(),
    sendAt: Joi.string().required(),
  };
  const { error } = Joi.validate(req.body, joiValidation);
  if (error) {
    res.status(422).json({
      status: 'error',
      message: 'Invalid request data',
      error: error.details[0].message,
    });
  }
  const { phone, sendAt } = req.body;
  const isValidTimestamp = dayjs(sendAt, DATE_FORMAT, true).isValid();
  if (!isValidTimestamp) {
    return res.status(422).json({
      status: 'error',
      message: 'Invalid request data',
      error: `sendAt should following this format ${DATE_FORMAT}`,
    });
  }
  const { id } = req.params;
  try {
    const message = await models.Message.findByPk(id);
    if (!message) {
      res.status(422).json({
        code: 422,
        message: 'Message not found',
        status: constants.errorCodes.BAD_DATA_VALIDATION,
      });
    }
    const checkExisting = await models.Message.findOne({
      where: {
        phone,
        sendAt,
        id: {
          [Op.ne]: id,
        },
      },
    });
    if (checkExisting) {
      res.status(422).json({
        code: 422,
        message: 'message already exists.',
        status: constants.errorCodes.BAD_DATA_VALIDATION,
      });
    }

    await message.update(req.body);
    await message.reload();
    return res.status(200).json({
      code: 200,
      status: 'success',
      message: 'detail Message',
      data: message,
    });
  } catch (err) {
    // res.status(401).json(error)
    return res.status(400).json({
      code: 400,
      status: constants.errorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }
}

async function sendMessage(req, res) {
  try {
    const messages = await models.Message.findAll({
      where: {
        messageId: { [Op.eq]: null },
        sendAt: {
          [Op.and]: [
            { [Op.gte]: dayjs().toISOString() },
            { [Op.lt]: dayjs().add(1, 'minute').toISOString() },
          ],
        },
      },
    });
    const messagePromises = messages.map((item) =>
      callApi({ flag: 'send', item })
    );
    await Promise.all(messagePromises);
    return 'success';
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      code: 400,
      status: constants.errorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    });
  }
}

async function updateStatus(req, res) {
  try {
    const messages = await models.Message.findAll({
      where: {
        messageId: { [Op.ne]: null },
        status: { [Op.in]: ['UNKNOWN', 'ACCEPTD'] },
        sendAt: {
          [Op.and]: [{ [Op.lt]: dayjs().add(-10, 'minute').toISOString() }],
        },
      },
    });
    const messagePromises = messages.map((item) =>
      callApi({ flag: 'check_status', item })
    );
    await Promise.all(messagePromises);
    return 'success';
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      code: 400,
      status: constants.errorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      error,
    });
    // res.status(401).json(error)
  }
}

module.exports = {
  getAll,
  getSent,
  create,
  update,
  updateStatus,
  sendMessage,
};
