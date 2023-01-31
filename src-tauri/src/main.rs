#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod node_store;

use node_store::NodeStore;
use std::fs::File;
use std::{
    fs,
    sync::{Arc, Mutex},
};
use tauri::State;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn set_value(
    state: State<'_, Arc<Mutex<NodeStore>>>,
    namespace: &str,
    key: &str,
    node: &str,
) -> Result<String, String> {
    let set_value_result = state.lock().unwrap().set_value(namespace, key, node);
    return match set_value_result {
        Ok(_) => Ok("Ok".to_owned()),
        Err(err) => Err(err.to_string()).to_owned(),
    };
}

#[tauri::command]
fn get_value(
    state: State<'_, Arc<Mutex<NodeStore>>>,
    namespace: &str,
    key: &str,
) -> Result<String, String> {
    let get_value_result = state.lock().unwrap().get_value(namespace, key);

    return match get_value_result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()).to_owned(),
    };
}

#[tauri::command]
fn get_values(
    state: State<'_, Arc<Mutex<NodeStore>>>,
    namespace: &str,
) -> Result<Vec<String>, String> {
    let get_entries_result = state.lock().unwrap().get_values(namespace);

    return match get_entries_result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    };
}

#[tauri::command]
fn list_namespaces(state: State<'_, Arc<Mutex<NodeStore>>>) -> Result<Vec<String>, String> {
    let list_namespaces_result = state.lock().unwrap().list_namespaces();
    return match list_namespaces_result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    };
}

#[tauri::command]
fn drop_namespace(
    state: State<'_, Arc<Mutex<NodeStore>>>,
    namespace: &str,
) -> Result<String, String> {
    let delete_namespace_result = state.lock().unwrap().delete_namespace(namespace);
    return match delete_namespace_result {
        Ok(_) => Ok("Ok".to_owned()),
        Err(err) => Err(err.to_string()),
    };
}

fn get_data_path_buf() -> std::path::PathBuf {
    let mut path_buf = tauri::api::path::home_dir().unwrap();
    path_buf.push("karen-ui");
    return path_buf;
}

fn create_db_dir() -> (String, bool) {
    let path_buf = get_data_path_buf();
    let path_buf_exists = path_buf.exists();

    let os_str = path_buf.into_os_string();
    let os_str_str = os_str.to_str().unwrap();

    let path = os_str_str;

    if !path_buf_exists {
        match fs::create_dir_all(path) {
            Ok(result) => result,
            Err(err) => panic!("Could not create db-directory:\t{}", err.to_string()),
        };
    }

    println!("path {}", path);
    return (path.to_owned(), path_buf_exists);
}

fn main() {
    let (path, dbExists) = create_db_dir();
    let node_store_result = NodeStore::new(path.as_str(), dbExists);
    let node_store = match node_store_result {
        Ok(result) => result,
        Err(err) => {
            panic!("Could not init the DB: {}", err.into_string());
        }
    };

    let mutex_nodestore = Arc::new(Mutex::new(node_store));

    tauri::Builder::default()
        .manage(mutex_nodestore)
        .invoke_handler(tauri::generate_handler![
            set_value,
            get_value,
            get_values,
            list_namespaces,
            drop_namespace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
