
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const categoriesDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
  input createCategory {
    category: String!
  }

  input updateCategory {
    category: String!
    archive: Boolean!
  }

  input delete{
    id: Int!
  }

  input category{
    id: Int!
  }

  type showMessage{
    message:String
  }

  type Query {
    getAllCategories(input: category): JSON!
    deleteCategory(input: delete!): showMessage!
  }

  type Mutation {
    createCategory(input: createCategory!): showMessage!
    updateCategory(input: updateCategory!): showMessage!
  }

`;

module.exports = categoriesDefs