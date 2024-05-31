const { PrismaClient, Prisma } = require('../../src/generated/client')
const { errorName, successName } = require('../../utils/constants');
const { errorGenerator } = require('../../helper/helper')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const braintree = require('braintree');

const prisma = new PrismaClient({
    errorFormat: 'pretty'
})

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // Use Production for live
    merchantId: "7fmbrqtmqbwmx75p",
    publicKey: "fpvjtk3x42pgm3vr",
    privateKey: "ef8b0b287608e572eb150bbd1e294d1d",
});

const ordersResolver = {

    Query: {
        getClientToken: async (parent, { input }, ctx) => {
            try {
                const { paymentType } = input
                let response = null
                let type = ""
                if (paymentType === "stripe") {
                    response = await stripe.setupIntents.create();
                    type = "client_secret"
                }
                else {
                    response = await gateway.clientToken.generate({});
                    type = "clientToken"
                }
                return {
                    clientToken: response[type]
                }
            } catch (err) {
                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        getAllOrders: async (parent, { input }, ctx) => {
            try {
                let filter = {}
                if (input?.id || input?.customerId) filter = { ...input }
                const orders = await prisma.orders.findMany({
                    where: filter
                })
                return orders

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

        cancelOrderByUser: async (parent, { input }, { id }) => {
            try {
                const { orderId } = input

                const order = await prisma.orders.update({
                    where: {
                        id: orderId
                    },
                    data: {
                        archive: true
                    }
                })

                if (order.paymentType === "stripe") {
                    await stripe.subscriptions.cancel(
                        order.subscriptionId
                    );
                } else {
                    gateway.subscription.cancel(order.subscriptionId, (err, result) => {
                    });
                }

                await prisma.user.update({
                    where: {
                        id
                    },
                    data: {
                        customerId: null,
                        paymentType: null
                    }
                })

                return {
                    message: successName.ORDERCANCEL
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        },


        cancelOrderByAdmin: async (parent, { input }, ctx) => {
            try {
                const { orderId } = input

                const order = await prisma.orders.update({
                    where: {
                        id: orderId
                    },
                    data: {
                        archive: true
                    }
                })

                if (order.paymentType === "stripe") {
                    await stripe.subscriptions.cancel(
                        order.subscriptionId
                    );
                } else {
                    gateway.subscription.cancel(order.subscriptionId, (err, result) => {
                    });
                }

                await prisma.user.update({
                    where: {
                        id: order.userId
                    },
                    data: {
                        customerId: null,
                        paymentType: null
                    }
                })

                return {
                    message: successName.ORDERCANCEL
                }

            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2025') return errorGenerator(errorName.NORECORDFOUND)
                    else return errorGenerator(errorName.INTERNALSERVER)
                }

                return errorGenerator(errorName.INTERNALSERVER)
            }
        },

    },

    Mutation: {
        orderPlace: async (parent, { input }, { id }) => {
            try {
                const { paymentType, paymentMethodId, planId } = input
                let customer = null
                let subscription = null
                const user = await prisma.user.findUnique({
                    where: {
                        id
                    }
                })
                const product = await stripe.products.retrieve(planId);

                if (paymentType === "stripe") {
                    customer = await stripe.customers.create({
                        email: user.email,
                        payment_method: paymentMethodId,
                        invoice_settings: {
                            default_payment_method: paymentMethodId,
                        },
                    });

                    subscription = await stripe.subscriptions.create({
                        customer: customer.id,
                        items: [{ plan: planId }],
                    });
                }
                else {
                    customer = await gateway.customer.create({
                        email: user.email,
                        paymentMethodNonce: paymentMethodId
                    });
                    subscription = await gateway.subscription.create({
                        paymentMethodToken: customerResult.customer.paymentMethods[0].token,
                        planId: planId
                    });
                }

                await prisma.user.update({
                    where: {
                        id
                    },
                    data: {
                        customerId: customer.id,
                        paymentType
                    }
                })

                await prisma.orders.create({
                    data: {
                        orderName: product.name,
                        customerName: user.fullname,
                        customerEmail: user.email,
                        paymentType,
                        planId,
                        customerId: customer.id,
                        userId: user.id,
                        subscriptionId: subscription.id
                    }
                })

                return {
                    message: successName.ORDER
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
}


module.exports = ordersResolver;