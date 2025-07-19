mod handler;
mod todo;
mod route;
mod auth;

use config::Config;
use route::create_router;

use crate::auth::AuthConfig;

#[tokio::main]
async fn main() {

    let settings = Config::builder()
        .add_source(config::File::with_name("./Settings.toml"))
        // Add in settings from the environment (with a prefix of APP)
        // Eg.. `APP_DEBUG=1 ./target/app` would set the `debug` key
        .add_source(config::Environment::with_prefix("APP"))
        .build()
        .unwrap();

    let config = AuthConfig {
        audience: settings.get_string("audience").expect("Audience not set in settings"),
        issuer: settings.get_string("issuer").expect("Issuer not set in settings"),
        jwks_url: settings.get_string("jwks_url").expect("JWKS URL not set in settings"),
    };

    let app = create_router(config);

    println!("🚀 Server started successfully");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}