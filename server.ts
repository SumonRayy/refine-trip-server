import { ApolloServer, gql } from 'apollo-server-express';
import express, { Express } from 'express';
import mongoose, { Document } from 'mongoose';

const app: Express = express();
const port = 4000;

// Define the user schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  type Query {
    dummy: Boolean
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
  }
`;

// Define the user model
interface UserDocument extends Document {
  name: string;
  email: string;
}

const User = mongoose.model<UserDocument>('User', new mongoose.Schema({
  name: String,
  email: String,
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/refine-trip-server');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Create the Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      dummy: () => true, // An empty dummy resolver to satisfy the root Query type
    },
    Mutation: {
      createUser: async (_, { input }) => {
        // Log the input data
        console.log('Creating user:', input);

        // Create a new user document
        const user = new User(input);

        // Save the user to the database
        await user.save();

        // Return the created user
        return user;
      },
    },
  },
  context: { db }, // Pass the MongoDB connection to the Apollo Server context
});

// Start the server and apply the Apollo Server middleware
async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });

  // Start the server
  app.listen({ port }, () => {
    console.log(`Server running at http://localhost:${port}${server.graphqlPath}`);
  });
}

startApolloServer();
