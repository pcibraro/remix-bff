use axum::{
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use utoipa;

use crate::{
    todo::{Todo, TodoListResponse},
    auth::Claims
};

#[utoipa::path(
    get,
    path = "/api/todos",
    responses(
        (status = 200, description = "List all todos successfully", body = TodoListResponse),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "todos"
)]
pub async fn todos_list_handler(_claims: Claims) -> impl IntoResponse {
    
    let datetime = chrono::Utc::now();

    let todos = vec![
        Todo {
            id: Some(Uuid::new_v4().to_string()),
            title: "Rust lang".to_string(),
            content: "Study the Rust programming language".to_string(),
            completed: Some(false),
            createdAt: Some(datetime),
            updatedAt: Some(datetime),
        },
        Todo {
            id: Some(Uuid::new_v4().to_string()),
            title: "Build API".to_string(),
            content: "Create a REST API with Axum".to_string(),
            completed: Some(true),
            createdAt: Some(datetime),
            updatedAt: Some(datetime),
        },
        Todo {
            id: Some(Uuid::new_v4().to_string()),
            title: "Unit testing".to_string(),
            content: "Add unit tests for the application".to_string(),
            completed: Some(false),
            createdAt: Some(datetime),
            updatedAt: Some(datetime),
        },
    ];

    let json_response = TodoListResponse {
        status: "success".to_string(),
        results: todos.len(),
        todos,
    };

    Json(json_response)
}

