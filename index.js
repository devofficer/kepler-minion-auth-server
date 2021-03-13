const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { GraphQLClient, gql } = require('graphql-request');
const { HASURA_ENDPOINT, HASURA_GHOST_TOKEN } = require('./constants');
const { generateJWT } = require('./generate-jwt');

const PORT = process.env.PORT || 5000

const client = new GraphQLClient(HASURA_ENDPOINT, {
  headers: {
    'Authorization': `Bearer ${HASURA_GHOST_TOKEN}`
  }
});

const GQL_GET_TOKEN = gql`
query MyQuery($token: String!) {
  signal_db_privileges(where: {user_token: {_eq: $token} }) {
    id, user_token, role
  }
}
`;

const GQL_INSERT_TOKEN = gql`
mutation($token: String!) {
  insert_signal_db_privileges_one(
    object: {
      user_token: $token
    }
  ) {
    id
    user_token
    role
  }
}
`;

const app = express();

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.post('/api/get_token', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");  
  const userToken = req.body.user_token;
  client
    .request(GQL_GET_TOKEN, { token: userToken })
    .then(data => {
      const user_info = data.signal_db_privileges?.[0];

      if (user_info) {
        const jwt = generateJWT(user_info);
        res.json({ jwt, user_info });
      }
      else {
        client
          .request(GQL_INSERT_TOKEN, { token: userToken })
          .then(data => {
            const user_info = data.insert_signal_db_privileges_one;
            const jwt = generateJWT(user_info);
            res.json({ jwt, user_info });
          });
      }
    })
    .catch(err => console.log(err))
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`))
