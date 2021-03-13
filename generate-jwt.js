const jwt = require('jsonwebtoken');
const { HASURA_JWT_SECRETE_KEY } = require('./constants');

module.exports.generateJWT = ({ role, user_token }) => {
    return jwt.sign({
        "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["admin", "user", "guest", 'not-allowed'],
            "x-hasura-default-role": role,
            "x-hasura-user-id": user_token
        }
    }, HASURA_JWT_SECRETE_KEY, { algorithm: 'HS256', noTimestamp: true });
};