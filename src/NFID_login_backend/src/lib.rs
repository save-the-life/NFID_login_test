use ic_cdk::storage;
use  candid::{CandidType, Deserialize};
use std::collections::HashMap;
use serde::Serialize;
use ic_cdk::update;


#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[update]
fn get_trusted_origins() -> Vec<String> {
    return vec![
        String::from("http://127.0.0.1:4943"),
        String::from("http://localhost:4943"),
    ];
}