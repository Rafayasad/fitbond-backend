
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const channelsDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
  input createChannel {
    channel: String!
    categoryId: Int!
    link: String
  }

  input updateChannel {
    channel: String!
    categoryId: Int!
    link: String
    archive: Boolean!
  }

  input delete{
    id: Int!
  }

  input channel{
    id: Int!
  }

  type showMessage{
    message:String
  }

  type Query {
    getAllChannels(input: channel): JSON!
    deleteChannel(input: delete!): showMessage!
  }

  type Mutation {
    createChannel(video: Upload,input: createChannel!): showMessage!
    updateChannel(video: Upload,input: updateChannel!): showMessage!
  }

`;

module.exports = channelsDefs