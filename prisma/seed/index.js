const { PrismaClient } = require('../../src/generated/client')

const prisma = new PrismaClient({
    errorFormat: 'pretty'
})

async function main() {

    const roles = [
        {
            role: 'admin'
        },
        {
            role: 'user',
        }
        // Add more objects for additional rows
    ];


    const createdRoles = await Promise.all([
        ...roles.map(role =>
            prisma.roles.upsert({
                where: { id: -1 }, // Choose a unique identifier
                update: {},
                create: role,
            })
        )
    ]);

    console.log('Created roles:', createdRoles);
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })