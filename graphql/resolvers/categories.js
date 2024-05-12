const { PrismaClient, Prisma } = require('../../src/generated/client')
const { errorName, successName } = require('../../utils/constants');
const { errorGenerator } = require('../../helper/helper')

const prisma = new PrismaClient({
    errorFormat: 'pretty'
})

const categoriesResolver = {

    Query: {

        getAllCategories: async (parent, { input }, ctx) => {
            try {
                let filter = {}
                if (input?.id) filter = input
                const categories = await prisma.categories.findMany({
                    where: filter,
                    include: {
                        channels: true
                    },
                })
                return categories

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        deleteCategory: async (parent, { input }, ctx) => {
            try {

                const channel = await prisma.channels.findFirst({
                    where: {
                        categoryId: input.id
                    }
                })

                if (channel) return errorGenerator(errorName.CATEGORYHAVECHANNEL)
                await prisma.categories.delete({
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

        createCategory: async (parent, { input }, ctx) => {
            try {
                const { category } = input
                await prisma.categories.create({
                    data: {
                        category
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

        updateCategory: async (parent, { input }, ctx) => {
            try {
                const { category, archive, id } = input
                await prisma.categories.update({
                    where: {
                        id
                    },
                    data: {
                        category,
                        archive
                    }
                })

                if (archive) await prisma.channels.updateMany({
                    where: {
                        categoryId: id
                    },
                    data: {
                        archive: true
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


module.exports = categoriesResolver;