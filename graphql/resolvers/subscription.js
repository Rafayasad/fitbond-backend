const { PrismaClient, Prisma } = require('../../src/generated/client')
const { errorName, successName } = require('../../utils/constants');
const { errorGenerator } = require('../../helper/helper')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { brainTreeConnection } = require('../../helper/helper')
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

const subscriptionResolver = {

    Query: {

        getAllSubscriptions: async (parent, { input }, ctx) => {
            try {
                const subscription = await prisma.subscription.findMany({
                    archive: false
                })
                return subscription;

            } catch (err) {
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
            const { name, desc, type, amount, services } = input;
            let stripeProduct = null;
            let stripePrice = null;
            let braintreePlan = null;

            try {
                // Create plan in Braintree
                if (type !== "week") {
                    const planResult = await gateway.plan.create({
                        name: name,
                        billingFrequency: type === 'month' ? 1 : 12, // Adjust based on your interval logic
                        price: (amount / 100).toFixed(2), // Braintree expects amount in dollars (e.g., 25.00 for $25.00)
                        currencyIsoCode: 'USD',
                        customFields: {
                            active: 'true',
                        }
                    });

                    if (!planResult.success) {
                        throw new Error('Failed to create plan in Braintree');
                    }

                    braintreePlan = planResult.plan;
                }

                // Create product in Stripe
                stripeProduct = await stripe.products.create({
                    name: name,
                    description: desc,
                    metadata: {
                        type,
                    },
                    default_price_data: {
                        currency: 'usd',
                        recurring: {
                            interval: type
                        },
                        unit_amount: amount * 10,
                    }
                });

                // Create subscription in Prisma
                await prisma.$transaction([
                    prisma.subscription.create({
                        data: {
                            name,
                            desc,
                            type,
                            amount,
                            services,
                            stripePlanId: stripeProduct.id,
                            braintreePlanId: braintreePlan.id ?? null
                        }
                    })
                ]);

                return {
                    message: successName.REGISTER
                };

            } catch (err) {
                // Rollback in case of an error

                // Rollback Brain tree if it was created
                if (braintreePlan) {
                    gateway.plan.update(braintreePlan.id, {
                        customFields: {
                            active: 'false',
                        }
                    })
                }


                // Rollback Stripe product if it was created
                if (stripeProduct) {
                    try {
                        await stripe.products.del(stripeProduct.id);
                    } catch (deleteError) {
                        console.error("Failed to delete Stripe product:", deleteError);
                    }
                }

                // Rollback Stripe price if it was created
                if (stripePrice) {
                    try {
                        await stripe.prices.update(stripePrice.id, {
                            active: false
                        });
                    } catch (deleteError) {
                        console.error("Failed to delete Stripe price:", deleteError);
                    }
                }

                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2002') return errorGenerator(errorName.CATEGORYALREADYEXIST);
                    else return errorGenerator(errorName.INTERNALSERVER);
                }
                return errorGenerator(errorName.INTERNALSERVER);
            }
        },

        updateSubscription: async (parent, { input }, ctx) => {
            try {
                const { name, desc, type, amount, services, id, stripePlanId, braintreePlanId, archive } = input

                const activeOrder = await prisma.orders.findUnique({
                    where: {
                        archive: false,
                        planId: stripePlanId ?? braintreePlanId
                    }
                })
                if (activeOrder) return errorGenerator(errorName.CANTUPDATEPLAN)

                const existingProduct = await prisma.subscription.findUnique({
                    where: {
                        id
                    }
                })

                const product = await prisma.subscription.update({
                    where: {
                        id
                    },
                    data: {
                        name,
                        desc,
                        type,
                        amount,
                        services,
                        archive
                    }
                })

                if (amount !== existingProduct.amount) {
                    const price = await stripe.prices.create({
                        currency: 'usd',
                        unit_amount: amount / 1000,
                        recurring: {
                            interval: type,
                        }
                    });
                    await stripe.products.update(
                        product.productId,
                        {
                            name,
                            description: desc,
                            metadata: {
                                type
                            },
                            active: archive,
                            default_price: price.id
                        }
                    );
                }
                else {
                    await stripe.products.update(
                        product.productId,
                        {
                            name,
                            description: desc,
                            metadata: {
                                type
                            },
                            active: archive
                        }
                    );
                }

                if (type !== "week") {
                    gateway.plan.update(braintreePlanId, {
                        name: name,
                        billingFrequency: type === 'month' ? 1 : 12, // Adjust based on your interval logic
                        price: (amount / 100).toFixed(2), // Braintree expects amount in dollars (e.g., 25.00 for $25.00)
                        currencyIsoCode: 'USD',
                        customFields: {
                            active: 'true',
                        }
                    })
                }

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