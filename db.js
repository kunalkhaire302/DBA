const users = [
    { user_id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { user_id: 2, username: 'teller', password: 'teller123', role: 'teller' },
    { user_id: 3, username: 'cust1', password: 'cust123', role: 'customer' }
];

const customers = [];
const accounts = [];
const transactions = [];

let customerIdCounter = 1;
let accountIdCounter = 1;

console.log("Mock DB module loaded instead of MySQL.");

const mockDb = {
    connect: (cb) => {
        console.log("Mock Database Connected");
        if (cb) cb(null);
    },
    query: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        
        const q = sql.trim().toUpperCase();

        if (q.startsWith("SELECT * FROM USERS")) {
            const [username, password] = params;
            const user = users.find(u => u.username === username && u.password === password);
            if (cb) cb(null, user ? [user] : []);
        } else if (q.startsWith("INSERT INTO CUSTOMER")) {
            const [name, email, phone, address] = params;
            customers.push({ customer_id: customerIdCounter++, name, email, phone, address });
            if (cb) cb(null);
        } else if (q.startsWith("INSERT INTO ACCOUNT")) {
            const [customer_id, account_type, balance] = params;
            accounts.push({ account_id: accountIdCounter++, customer_id, account_type, balance: Number(balance) });
            if (cb) cb(null);
        } else if (q.startsWith("SELECT * FROM ACCOUNT")) {
            const [account_id] = params;
            const acc = accounts.find(a => a.account_id == account_id);
            if (cb) cb(null, acc ? [acc] : []);
        } else if (q.startsWith("UPDATE ACCOUNT")) {
            const [amount, account_id] = params;
            const acc = accounts.find(a => a.account_id == account_id);
            if (acc) {
                if (q.includes("BALANCE - ?")) {
                    acc.balance -= Number(amount);
                } else {
                    acc.balance += Number(amount);
                }
            }
            if (cb) cb(null);
        } else if (q.startsWith("INSERT INTO TRANSACTIONS")) {
            const [account_id, amount, type] = params;
            transactions.push({ account_id, amount: Number(amount), type, date: new Date() });
            if (cb) cb(null);
        } else if (q.startsWith("SELECT COUNT(*) AS TOTALCUSTOMERS")) {
            if (cb) cb(null, [{ totalCustomers: customers.length || 12 }]);
        } else if (q.startsWith("SELECT COUNT(*) AS ACTIVEACCOUNTS")) {
            if (cb) cb(null, [{ activeAccounts: accounts.length || 8 }]);
        } else if (q.includes("FROM AUDIT_LOG")) {
            if (cb) cb(null, [{ log_id: 1, table_name: 'account', action: 'UPDATE', old_value: 'Bal: 1000', new_value: 'Bal: 1500', performed_by: 'admin', performed_at: new Date() }]);
        } else if (q.includes("FROM QUERY_LOGS")) {
            if (cb) cb(null, [{ log_id: 101, query_text: 'SELECT * FROM account', execution_time_ms: 12, route_called: '/api/v1', timestamp: new Date() }]);
        } else if (q.includes("FROM TRANSACTIONS")) {
            if (cb) cb(null, transactions.length ? transactions : [{ transaction_id: 99, account_id: 1001, amount: 5000, type: 'credit', date: new Date() }]);
        } else {
            console.log("Unhandled query:", sql);
            // Default to empty array wrapper to prevent array destructuring crashes
            if (cb) cb(null, [{}]); 
        }
    }
};

module.exports = mockDb;