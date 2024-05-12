const { PrismaClient, Prisma } = require('../../src/generated/client')
const { errorName, successName } = require('../../utils/constants');
const { errorGenerator } = require('../../helper/helper')

const prisma = new PrismaClient({
    errorFormat: 'pretty'
})

const subscriptionResolver = {

    Query: {

        getAllSubscriptions: async (parent, { input }, ctx) => {
            try {
                const subscription = await prisma.subscription.findMany()
                return subscription;

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        deleteSubscription: async (parent, { input }, ctx) => {
            try {
                await prisma.subscription.delete({
                    where: {
                        id: input.id
                    }
                })
                return {
                    message: successName.DELETED
                }
            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        }

    },

    Mutation: {

        createSubscription: async (parent, { input }, ctx) => {
            try {
                const { name, desc, type, amount, services } = input
                await prisma.subscription.create({
                    data: {
                        name,
                        desc,
                        type,
                        amount,
                        services
                    }
                })

                return {
                    message: successName.REGISTER
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2002') return errorGenerator(errorName.CATEGORYALREADYEXIST)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        updateSubscription: async (parent, { input }, ctx) => {
            try {
                const { name, desc, type, amount, services, id } = input
                await prisma.subscription.update({
                    where: {
                        id
                    },
                    data: {
                        name,
                        desc,
                        type,
                        amount,
                        services
                    }
                })

                return {
                    message: successName.UPDATED
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    if (err.code === 'P2002') return errorGenerator(errorName.CATEGORYALREADYEXIST)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        updateStatusSubscription: async (parent, { input }, ctx) => {
            try {
                const { archive, id } = input
                await prisma.subscription.update({
                    where: {
                        id
                    },
                    data: {
                        archive
                    }
                })

                return {
                    message: successName.UPDATED
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2002') return errorGenerator(errorName.CATEGORYALREADYEXIST)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },


    }

};


module.exports = subscriptionResolver;