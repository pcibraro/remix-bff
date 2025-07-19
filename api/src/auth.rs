use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json
};

use jwks::{Jwks};
use jsonwebtoken::{decode, decode_header, Validation};
use serde::{Deserialize, Serialize};

use serde_json::json;
use utoipa::ToSchema;
use std::sync::Arc;
use axum::extract::FromRef;

pub struct AuthConfig {
    pub audience: String,
    pub issuer: String,
    pub jwks_url: String,
}

// JWT Claims structure - adjust fields based on your external auth server
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Claims {
}

// Auth error types
#[derive(Debug)]
pub enum AuthError {
    InvalidToken(String),
    MissingCredentials,
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    Arc<AuthConfig>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let config = Arc::<AuthConfig>::from_ref(state);
        // Now use config.audience, config.issuer, config.jwks_url

        // Extract the bearer token from the Authorization header
        let jwt = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|header| header.strip_prefix("Bearer ").or_else(|| header.strip_prefix("bearer ")))
            .ok_or(AuthError::MissingCredentials)?;

        let header = decode_header(jwt).map_err(|_| AuthError::InvalidToken("Invalid jwt header".to_string()))?;
        let kid = header.kid.as_ref().ok_or(AuthError::InvalidToken("Missing kid in header".to_string()))?;
        
        let openid_config_url = &config.jwks_url;

        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap();

        let jwks = Jwks::from_jwks_url_with_client(&client, openid_config_url).await.unwrap();
        
        let jwk = jwks.keys.get(kid).ok_or(AuthError::InvalidToken("JWK not found for kid".to_string()))?;
 
        let mut validation = Validation::default();

        validation.algorithms = vec![jsonwebtoken::Algorithm::RS384];
        validation.validate_exp = true; // Validate expiration
        validation.validate_aud = true; // Validate audience
        validation.set_audience(&vec![&config.audience]);
        validation.set_issuer(&vec![&config.issuer]);

        let decoded_token =
            decode::<Claims>(jwt, &jwk.decoding_key, &validation)
                .map_err(|error| {
                    println!("JWT decode error: {:?}", error);

                    AuthError::InvalidToken(format!("JWT validation failed: {:?}", error))
                })?; 

        Ok(decoded_token.claims)
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message): (StatusCode, String) = match self {
            AuthError::InvalidToken(msg) => (StatusCode::UNAUTHORIZED, msg),
            AuthError::MissingCredentials => (StatusCode::UNAUTHORIZED, "Missing credentials".to_string()),
        };
        
        let body = Json(json!({
            "error": error_message,
        }));
        
        (status, body).into_response()
    }
}

