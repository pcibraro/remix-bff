import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import jwt, { JwtPayload, JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";


const { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CALLBACK_URL, OIDC_SERVER_URL, OIDC_AUDIENCE } = process.env;

// Ensure they are defined and throw error if not
if (!OIDC_CLIENT_ID) throw new Error("Missing client id");
if (!OIDC_CLIENT_SECRET) throw new Error("Missing client secret");
if (!OIDC_CALLBACK_URL) throw new Error("Missing callback URL");
if (!OIDC_SERVER_URL) throw new Error("Missing OIDC server URL");
if (!OIDC_AUDIENCE) throw new Error("Missing OIDC audience");

// Define your user type
type User = {
  id: string;
  email: string;
  name: string;
};

// Get JWKS URI from OpenID config
const getJwksUri = async () => {
  const res = await fetch(`${OIDC_SERVER_URL}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error('Failed to fetch OpenID config');
  const config = await res.json();
  return config.jwks_uri;
};

// Initialize JWKS client with caching
let client : jwksClient.JwksClient | null = null;

const initJwksClient = async () => {
  const jwksUri = await getJwksUri();
  client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 60 * 60 * 1000 // 1 hour
  });
};

// Get the signing key for the given kid
const getKey = async (header : JwtHeader) => {
  const key = await client!.getSigningKey(header.kid);
  
  return key.getPublicKey();
};

// Decode and verify token
const validateIdToken = async (idToken : string) : Promise<User> => {
  if (!client) await initJwksClient();

  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header?.kid) {
    throw new Error('Invalid JWT header');
  }

  const publicKey = await getKey(decodedHeader.header);

  const decoded = jwt.verify(idToken, publicKey, {
    audience: OIDC_AUDIENCE,
    issuer: OIDC_SERVER_URL
  }) as JwtPayload;

  if(!decoded) {
    throw new Error('Invalid JWT token');
  }

  return {
    id: decoded.preferred_username as string, 
    email: decoded.email as string,
    name: `${decoded.given_name} ${decoded.family_name}`  as string
  };

};

/* const validateAccessTokenWithUserInfoEndpoint = async (accessToken : string) : Promise<User> => {
  const response = await fetch(`${OIDC_SERVER_URL}/oidc/userinfo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }});

      if(!response.ok)
        throw new Error("Failed to fetch user data from OIDC provider");
      
      const userData = await response.json();
      
      return {
        id: userData.sub, // Assuming 'sub' is the user ID
        email: userData.email,
        name: userData.name || "No Name Provided", // Fallback if name is not available
      };
      
} */

// Create an instance of the authenticator, pass a generic with what
// strategies will return
export const authenticator = new Authenticator<User>();

const strategy = new OAuth2Strategy (
    {
      clientId: OIDC_CLIENT_ID,
      clientSecret: OIDC_CLIENT_SECRET,
      redirectURI: OIDC_CALLBACK_URL,
      scopes: ["openid", "email", "profile"],
      authorizationEndpoint: `${OIDC_SERVER_URL}/oidc/authorize`,
      tokenEndpoint: `${OIDC_SERVER_URL}/oidc/token`,
    },
    async ({ tokens }) => {
      
      const tokenData = (tokens.data as { access_token: string, id_token: string });
      
      const idToken = tokenData.id_token;

      return await validateIdToken(idToken);
    }
  );

authenticator.use(
  strategy,
  "oidc"
);