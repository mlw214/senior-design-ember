#!/bin/bash

mkdir experiment-files security

touch ./security/secret.js

fayeSecret=$(openssl rand -base64 32)

echo "exports.fayeSecret = '$fayeSecret'" > ./security/secret.js

storeSecret=$(openssl rand -base64 32)

echo "exports.storeSecret = '$storeSecret'" >> ./security/secret.js

openssl genrsa -out ./security/token.pem 2048
openssl rsa -in ./security/token.pem -pubout > ./security/token.pub

npm install