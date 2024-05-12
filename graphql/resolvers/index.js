const userResolver = require('./user');
const rolesResolver = require('./roles');
const categoriesResolver = require('./categories');
const channelsResolver = require('./channels');
const subscriptionResolver = require('./subscription');

module.exports = [
    userResolver,
    rolesResolver,
    categoriesResolver,
    channelsResolver,
    subscriptionResolver
]