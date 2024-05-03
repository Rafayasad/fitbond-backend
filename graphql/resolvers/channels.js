const { PrismaClient, Prisma } = require('../../src/generated/client')
const { errorName, successName } = require('../../utils/constants');
const { errorGenerator } = require('../../helper/helper')

const prisma = new PrismaClient({
    errorFormat: 'pretty'
})

const channelsResolver = {

    Query: {

        getAllChannels: async (parent, { input }, ctx) => {
            try {
                let filter = {
                    archive: false
                }
                if (input?.id) filter = { ...filter, input }
                const channels = await prisma.channels.findMany({
                    where: filter
                })
                return channels

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        deleteChannel: async (parent, { input }, ctx) => {
            try {

                await prisma.channels.delete({
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

        createChannel: async (parent, { input, video }, ctx) => {
            try {
                if (video != undefined) {
                    input = {
                        ...input,
                        link: await upload.upload(video.file, "channel")
                    }
                }
                if (!input.link) return errorGenerator(errorName.CHANNELVIDEOREQUIRED)

                await prisma.categories.findUnique({
                    where: {
                        id: input.categoryId
                    }
                })

                await prisma.channels.create({
                    data: input
                })

                return {
                    message: successName.REGISTER
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    if (err.code === 'P2002') return errorGenerator(errorName.CHANNELALREADYEXIST)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        updateChannel: async (parent, { input, video }, ctx) => {
            try {
                filter = {
                    id: input.categoryId,
                    archive: false
                }

                await prisma.categories.findUnique({
                    where: filter
                })

                await prisma.channels.findUnique({
                    where: {
                        id: input.id
                    }
                })

                if (video != undefined) {
                    input = {
                        ...input,
                        link: await upload.upload(video.file, "channel")
                    }
                }
                if (!input.link) return errorGenerator(errorName.CHANNELVIDEOREQUIRED)


                await prisma.channels.update({
                    data: input
                })

                return {
                    message: successName.UPDATED
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    if (err.code === 'P2002') return errorGenerator(errorName.CHANNELALREADYEXIST)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },


    }

};


module.exports = channelsResolver;