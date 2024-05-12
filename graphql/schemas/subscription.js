
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const subscriptionDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
  input createSubscription {
    name: String!
    desc: String
    type: String!
    amount: Int!
    services: [String!]!
  }

  input updateSubscription {
    name: String!
    desc: String
    type: String!
    amount: Int!
    services: [String!]!
    id: Int!
  }

  input updateStatusSubscription {
    archive: Boolean!
  }

  input delete{
    id: Int!
  }

  input subscription{
    id: Int!
  }

  type showMessage{
    message:String
  }

  type Query {
    getAllSubscriptions(input: subscription): JSON!
    deleteSubscription(input: delete!): showMessage!
  }

  type Mutation {
    createSubscription(input: createSubscription!): showMessage!
    updateSubscription(input: updateSubscription!): showMessage!
    updateStatusSubscription(input: updateStatusSubscription!): showMessage!
  }

`;

module.exports = subscriptionDefs