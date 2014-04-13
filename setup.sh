#!/bin/bash

# Miller Wilt
# 2013-04-12
# setup.sh

# Setup script to prepare new servers to run our Node.js app.

mkdir experiment-files security

touch ./security/secret.js

fayeSecret=$(openssl rand -base64 32)

echo "exports.fayeSecret = '$fayeSecret'" > ./security/secret.js

storeSecret=$(openssl rand -base64 32)

echo "exports.storeSecret = '$storeSecret'" >> ./security/secret.js

openssl genrsa -out ./security/token.pem 2048
openssl rsa -in ./security/token.pem -pubout > ./security/token.pub

npm install
