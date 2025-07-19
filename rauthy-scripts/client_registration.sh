#!/bin/bash

# Set the API key as a variable (make sure to escape $ with \ if needed)
API_KEY="bootstrap\$uxRPxZM2ghItJo8VmP9SHlg9p1XZl9HQT8OQVpZehUp1xuCu2LNxTLpR6Bdyzamq"

# Make the POST request and store the response
response=$(curl -sk -X POST https://localhost:8443/auth/v1/clients \
  -H "Authorization: API-Key $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "blog",
    "name": "blog",
    "enabled": true,
    "confidential": true,
    "redirect_uris": [
      "http://localhost:5173/oidc/callback"
    ],
    "flows_enabled": [
      "authorization_code",
      "client_credentials"
    ],
    "access_token_alg": "EdDSA",
    "id_token_alg": "RS256",
    "auth_code_lifetime": 10,
    "access_token_lifetime": 10,
    "scopes": [
      "openid"
    ],
    "default_scopes": [
      "openid"
    ],
    "challenges": [
      "S256"
    ],
    "force_mfa": false,
    "client_uri": "http://localhost:5173/",
    "contacts": [
      "admin@localhost"
    ]
  }')

echo $response

# Generate a new secret
secret_response=$(curl -sk -X POST https://localhost:8443/auth/v1/clients/blog/secret \
  -H "Authorization: API-Key $API_KEY" \
  -H "Content-Type: application/json")

# Extract and print new secret
new_secret=$(echo "$secret_response" | jq -r '.secret')
echo "Newly Generated Client Secret: $new_secret"


