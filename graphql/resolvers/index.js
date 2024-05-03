const userResolver = require('./user');
const rolesResolver = require('./roles');
const categoriesResolver = require('./categories');
const channelsResolver = require('./channels');

module.exports = [
    userResolver,
    rolesResolver,
    categoriesResolver,
    channelsResolver
]