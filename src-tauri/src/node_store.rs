use rocksdb::{DBWithThreadMode, Error, Options, SingleThreaded, DB};
// use std::collections::HashSet;

// const NAMESPACE_KEY_SEPERATOR: &str = "_";

pub struct NodeStore {
    pub db: DB,
    pub path: String,
}

impl NodeStore {
    pub fn new(path: &str, dbExists: bool) -> Result<Self, Error> {
        let mut db: DBWithThreadMode<SingleThreaded>;

        let mut opts = Options::default();
        opts.create_missing_column_families(true);
        opts.create_if_missing(true);
        if dbExists {
            let cfs = match DB::list_cf(&opts, path) {
                Ok(result) => result,
                Err(err) => return Err(err),
            };
            let db_result = DB::open_cf(&opts, path, cfs);
            db = match db_result {
                Ok(result) => result,
                Err(err) => return Err(err),
            };
        } else {
            let db_result = DB::open_default(path);
            db = match db_result {
                Ok(result) => result,
                Err(err) => return Err(err),
            };
        }

        Ok(Self {
            db: db,
            path: path.to_owned(),
        })
    }

    pub fn set_value(&mut self, namespace: &str, key: &str, node: &str) -> Result<(), Error> {
        let mut namespace_key: String = namespace.to_owned();
        namespace_key.push_str(key);

        let is_namespace_present_result = self.is_namespace_present(namespace);

        let is_namespace_present = match is_namespace_present_result {
            Ok(result) => result,
            Err(err) => return Err(err),
        };

        if !is_namespace_present {
            let opts = Options::default();
            let create_cf_result = self.db.create_cf(namespace, &opts);

            match create_cf_result {
                Ok(result) => result,
                Err(err) => return Err(err.clone().to_owned()),
            };
        }
        let cf = self.db.cf_handle(namespace).unwrap();

        let put_result = self.db.put_cf(cf, key, node);
        return put_result;
    }

    pub fn get_value(&self, namespace: &str, key: &str) -> Result<String, String> {
        let cf = self.db.cf_handle(namespace).unwrap();

        let get_result = self.db.get_cf(cf, key);
        let raw_node = match get_result {
            Ok(result) => result.unwrap(),
            Err(err) => return Err(err.to_string()),
        };
        let from_utf8_result = std::string::String::from_utf8(raw_node);
        match from_utf8_result {
            Ok(node) => Ok(node),
            Err(err) => Err(err.to_string()),
        }
    }

    pub fn get_values(&self, namespace: &str) -> Result<Vec<String>, String> {
        let mut nodes: Vec<String> = vec![];
        let cf = match self.db.cf_handle(namespace) {
            Some(cf) => cf,
            None => {
                let err_msg = format!("The namespace {} is not present", namespace);
                return Err(err_msg);
            }
        };

        let iter = self.db.iterator_cf(cf, rocksdb::IteratorMode::Start);
        for item in iter {
            let (_, value) = item;
            let node = String::from_utf8(value.to_vec()).unwrap();
            nodes.push(node)
        }
        return Ok(nodes);
    }

    fn is_namespace_present(&self, searched_namespace: &str) -> Result<bool, Error> {
        let list_namespaces_result = self.list_namespaces();
        let namespaces = match list_namespaces_result {
            Ok(result) => result,
            Err(err) => return Err(err),
        };
        for namespace in namespaces {
            if namespace.eq(searched_namespace) {
                return Ok(true);
            }
        }
        return Ok(false);
    }

    pub fn list_namespaces(&self) -> Result<Vec<String>, Error> {
        let opts = Options::default();
        let list_cf_results = DB::list_cf(&opts, self.path.as_str());
        return list_cf_results;
    }

    pub fn delete_namespace(&mut self, namespace: &str) -> Result<(), Error> {
        return self.db.drop_cf(namespace);
    }
}
