use candid::{CandidType, Principal};
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct User {
    user_principal: Principal,  // user's principal
    wallet_address: String,     // user's wallet address
}

type Users = HashMap<Principal, User>;

// Define thread local variables, and make each thread to have an independent value
thread_local! {
    static USERS: std::cell::RefCell<Users> = std::cell::RefCell::new(Users::new());
    static PRINCIPALS: std::cell::RefCell<Vec<Principal>> = std::cell::RefCell::new(Vec::new());
}

// Create and initialize a new hash map at the time of canister initialization
#[init]
fn init() {
    USERS.with(|users| {
        *users.borrow_mut() = Users::new();
    });
    PRINCIPALS.with(|principals| {
        *principals.borrow_mut() = Vec::new();
    });
}

// pre_upgrade to use stable memory
#[pre_upgrade]
fn pre_upgrade() {
    USERS.with(|users| {
        let users = users.borrow();
        PRINCIPALS.with(|principals| {
            let principals = principals.borrow();
            // store USERS and PRINCIPALS at stable memory
            ic_cdk::storage::stable_save((users.clone(), principals.clone())).expect("Failed to save stable storage.");
        });
    });
}

// post_upgrade to use stable memory
#[post_upgrade]
fn post_upgrade() {
    // restore the data from stable memory
    let result: Result<(Users, Vec<Principal>), _> = ic_cdk::storage::stable_restore();

    // store the restored data at USERS and PRINCIPALS
    match result {
        Ok((saved_users, saved_principals)) => {
            USERS.with(|users| {
                *users.borrow_mut() = saved_users;
            });
            PRINCIPALS.with(|principals| {
                *principals.borrow_mut() = saved_principals;
            });
        },
        Err(e) => {
            ic_cdk::println!("Failed to restore stable storage: {}", e);
            init(); // data initialization
        }
    }
}

// store the new user info at stable memory
#[update]
fn add_user(principal: Principal) -> Result<(), String> {
    let wallet_address = "dummy_wallet_address".to_string(); // arbitrary wallet address
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.contains_key(&principal) {
            Err(format!("User with principal {} already exists.", principal))
        } else {
            let user = User {
                user_principal: principal.clone(),
                wallet_address,
            };
            // add new user's data to USERS HashMap
            users.insert(principal.clone(), user);
            PRINCIPALS.with(|principals| {
                // add new princiapl to PRINCIPALS vector
                principals.borrow_mut().push(principal);
            });
            Ok(())
        }
    })
}


// get the user info from stable memory
#[query]
fn get_user(principal: Principal) -> Option<User> {
    USERS.with(|users| {
        let users = users.borrow();
        // return the user corresponding to the given principal
        users.get(&principal).cloned()
    })
}

// get all principals from stable memory
#[query]
fn get_all_principals() -> Vec<Principal> {
    PRINCIPALS.with(|principals| {
        // return the vector of all principals
        principals.borrow().clone()
    })
}

// return a list of trusted sources
#[update]
fn get_trusted_origins() -> Vec<String> {
    vec![
        String::from("http://127.0.0.1:4943"),
        String::from("http://localhost:4943"),
    ]
}