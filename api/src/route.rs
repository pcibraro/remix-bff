use axum::{
    routing::get,
    Router, Json
};
use std::sync::Arc;
use utoipa::OpenApi;

use crate::{
    auth::{AuthConfig}, handler::todos_list_handler, todo::{Todo, TodoListResponse}
};

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::handler::todos_list_handler
    ),
    security(
        ("bearer_auth" = [])
    ),
    components(
        schemas(Todo, TodoListResponse)
    ),
    tags(
        (name = "todos", description = "Todo management endpoints")
    ),
    info(
        title = "Todo API",
        version = "1.0.0",
        description = "A simple Todo API built with Axum and Rust with JWT authentication"
    )
)]
pub struct ApiDoc;

async fn openapi_spec() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

pub fn create_router(auth_config: AuthConfig) -> Router {
    let config: Arc<AuthConfig> = Arc::new(auth_config);

    Router::new()
        .route(
            "/api/todos",
            get(todos_list_handler),
        )
        .route("/api-docs/openapi.json", get(openapi_spec))
        .with_state(config)
}