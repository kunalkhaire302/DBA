const http = require('http');

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(cookie ? {'Cookie': cookie} : {})
      }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        try { resolve({ status: res.statusCode, body: JSON.parse(d), cookie: setCookie }); }
        catch(e) { resolve({ status: res.statusCode, body: d, cookie: setCookie }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

let pass = 0, fail = 0;
function check(testName, condition, detail) {
  if (condition) {
    pass++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    fail++;
    console.log(`  ❌ FAIL: ${testName} — ${detail || ''}`);
  }
}

async function runTests() {
  console.log('=== VERIFICATION TESTS ===\n');
  
  // ---- ADMIN LOGIN ----
  console.log('--- ADMIN LOGIN ---');
  let r = await req('POST', '/login', { username: 'admin', password: 'admin123' });
  const adminCookie = r.cookie ? r.cookie[0].split(';')[0] : null;
  check('Admin login succeeds', r.status === 200 && r.body.role === 'admin');
  check('Password hash NOT in response', !r.body.password, `Got password: ${!!r.body.password}`);
  check('Session cookie set', !!adminCookie);

  // ---- WRONG LOGIN ----
  console.log('\n--- WRONG LOGIN ---');
  r = await req('POST', '/login', { username: 'admin', password: 'wrong' });
  check('Wrong password rejected', r.body.message === 'Invalid login');
  
  r = await req('POST', '/login', { username: 'nonexist', password: 'test' });
  check('Non-existent user rejected', r.body.message === 'Invalid login');

  // ---- ADD CUSTOMER (was broken before — no created_at column) ----
  console.log('\n--- ADD CUSTOMER ---');
  r = await req('POST', '/addCustomer', { name: 'Blackbox Test User', email: 'bbtest@test.com', phone: '9876500000', address: '123 Test Lane' }, adminCookie);
  check('Add customer succeeds (created_at fix)', r.status === 200 && r.body.message === 'Customer Added', `Status: ${r.status}, Body: ${JSON.stringify(r.body)}`);

  // ---- ADD CUSTOMER: EMPTY NAME ----
  r = await req('POST', '/addCustomer', { name: '', email: 'e@test.com', phone: '111', address: '' }, adminCookie);
  check('Empty name rejected with 400', r.status === 400, `Status: ${r.status}`);

  // ---- ADD CUSTOMER: UNAUTHENTICATED ----
  r = await req('POST', '/addCustomer', { name: 'Hacker', email: 'h@h.com', phone: '111', address: '' }, null);
  check('Unauthenticated addCustomer blocked', r.status === 401, `Status: ${r.status}`);

  // ---- CREATE ACCOUNT VALIDATION ----
  console.log('\n--- CREATE ACCOUNT ---');
  r = await req('POST', '/createAccount', { customer_id: '', account_type: 'Saving', balance: '1000' }, adminCookie);
  check('Empty customer_id rejected', r.status === 400, `Status: ${r.status}`);

  r = await req('POST', '/createAccount', { customer_id: '1', account_type: 'InvalidType', balance: '1000' }, adminCookie);
  check('Invalid account type rejected', r.status === 400, `Status: ${r.status}`);

  r = await req('POST', '/createAccount', { customer_id: '1', account_type: 'Saving', balance: '-500' }, adminCookie);
  check('Negative balance rejected', r.status === 400, `Status: ${r.status}`);

  r = await req('POST', '/createAccount', { customer_id: '99999', account_type: 'Saving', balance: '1000' }, adminCookie);
  check('Non-existent customer ID returns error', r.status === 400, `Status: ${r.status}`);

  r = await req('POST', '/createAccount', { customer_id: '1', account_type: 'Current', balance: '5000' }, adminCookie);
  check('Valid account creation succeeds', r.status === 200, `Status: ${r.status}`);

  // ---- TRANSACTIONS ----
  console.log('\n--- TRANSACTIONS ---');
  r = await req('GET', '/api/all-accounts', null, adminCookie);
  const accounts = r.body;
  const testAccId = Array.isArray(accounts) && accounts.length > 0 ? accounts[0].account_id : null;

  if (testAccId) {
    // Valid deposit
    r = await req('POST', '/transaction', { account_id: testAccId, amount: 500, type: 'deposit' }, adminCookie);
    check('Valid deposit succeeds', r.status === 200);
    
    // Valid withdraw
    r = await req('POST', '/transaction', { account_id: testAccId, amount: 100, type: 'withdraw' }, adminCookie);
    check('Valid withdraw succeeds', r.status === 200);
    
    // Negative amount
    r = await req('POST', '/transaction', { account_id: testAccId, amount: -500, type: 'deposit' }, adminCookie);
    check('Negative amount rejected', r.status === 400, `Status: ${r.status}`);
    
    // Zero amount
    r = await req('POST', '/transaction', { account_id: testAccId, amount: 0, type: 'deposit' }, adminCookie);
    check('Zero amount rejected', r.status === 400, `Status: ${r.status}`);
    
    // Overdraft
    r = await req('POST', '/transaction', { account_id: testAccId, amount: 99999999, type: 'withdraw' }, adminCookie);
    check('Overdraft rejected with "Insufficient funds"', r.status === 400 && r.body.error.includes('Insufficient'), `Status: ${r.status}, Error: ${r.body.error}`);
    
    // Invalid type
    r = await req('POST', '/transaction', { account_id: testAccId, amount: 100, type: 'steal' }, adminCookie);
    check('Invalid transaction type rejected', r.status === 400, `Status: ${r.status}`);
    
    // Invalid account
    r = await req('POST', '/transaction', { account_id: 99999, amount: 100, type: 'deposit' }, adminCookie);
    check('Invalid account ID rejected', r.status === 400);
  }

  // Unauthenticated transaction
  r = await req('POST', '/transaction', { account_id: 1, amount: 100, type: 'deposit' }, null);
  check('Unauthenticated transaction blocked', r.status === 401);

  // ---- AUTH GUARDS ----
  console.log('\n--- AUTH GUARDS ---');
  r = await req('GET', '/customers', null, null);
  check('/customers blocked unauthenticated', r.status === 401);

  r = await req('GET', '/dashboard-stats', null, null);
  check('/dashboard-stats blocked unauthenticated', r.status === 401);

  r = await req('GET', '/my-accounts/1', null, null);
  check('/my-accounts blocked unauthenticated', r.status === 401);

  r = await req('GET', '/history/1', null, null);
  check('/history blocked unauthenticated', r.status === 401);

  r = await req('POST', '/createAccount', { customer_id: 1, account_type: 'Saving', balance: 100 }, null);
  check('/createAccount blocked unauthenticated', r.status === 401);

  // ---- SQL INJECTION ----
  console.log('\n--- SQL INJECTION PROTECTION ---');
  r = await req('POST', '/run-query', { query: 'DROP TABLE customer' }, adminCookie);
  check('DROP TABLE blocked', r.status === 403);
  
  r = await req('POST', '/run-query', { query: 'DELETE FROM customer WHERE 1=1' }, adminCookie);
  check('DELETE blocked', r.status === 403);
  
  r = await req('POST', '/run-query', { query: 'SELECT * FROM customer LIMIT 5' }, adminCookie);
  check('Valid SELECT allowed', r.status === 200);

  // ---- ROLE GUARDING ----
  console.log('\n--- ROLE-BASED ACCESS ---');

  // Login as teller
  r = await req('POST', '/login', { username: 'teller', password: 'teller123' });
  const tellerCookie = r.cookie ? r.cookie[0].split(';')[0] : null;
  
  if (tellerCookie) {
    check('Teller login succeeds', r.body.role === 'teller');
    
    r = await req('GET', '/api/users', null, tellerCookie);
    check('Teller blocked from /api/users', r.status === 403);

    r = await req('GET', '/api/backup/list', null, tellerCookie);
    check('Teller blocked from backup', r.status === 403);

    r = await req('GET', '/api/all-accounts', null, tellerCookie);
    check('Teller can access all-accounts', r.status === 200);
    
    r = await req('GET', '/api/customers', null, tellerCookie);
    check('Teller can access customer list', r.status === 200);
  } else {
    check('Teller login succeeds', false, 'Could not login as teller');
  }

  // Login as customer
  r = await req('POST', '/login', { username: 'cust1', password: 'cust123' });
  const custCookie = r.cookie ? r.cookie[0].split(';')[0] : null;

  if (custCookie) {
    check('Customer login succeeds', r.body.role === 'customer');

    r = await req('GET', '/api/users', null, custCookie);
    check('Customer blocked from /api/users', r.status === 403);

    r = await req('GET', '/api/all-accounts', null, custCookie);
    check('Customer blocked from all-accounts', r.status === 403);

    r = await req('GET', '/api/backup/list', null, custCookie);
    check('Customer blocked from backup', r.status === 403);
    
    r = await req('POST', '/addCustomer', { name: 'Hack', email: 'h@h.com', phone: '111', address: '' }, custCookie);
    check('Customer blocked from addCustomer', r.status === 403);
  } else {
    check('Customer login succeeds', false, 'Could not login as cust1');
  }

  // ---- SESSION ----
  console.log('\n--- SESSION MANAGEMENT ---');
  r = await req('GET', '/me', null, adminCookie);
  check('/me returns session info', r.status === 200 && r.body.role === 'admin');

  r = await req('GET', '/logout', null, adminCookie);
  check('Logout succeeds', r.body.ok === true);

  r = await req('GET', '/me', null, adminCookie);
  check('Session destroyed after logout', r.status === 401);

  // ---- AUDIT LOG ----
  console.log('\n--- AUDIT LOG ---');
  const adminLogin2 = await req('POST', '/login', { username: 'admin', password: 'admin123' });
  const admin2Cookie = adminLogin2.cookie ? adminLogin2.cookie[0].split(';')[0] : null;
  r = await req('GET', '/audit-log', null, admin2Cookie);
  check('Audit log returns data', r.status === 200 && Array.isArray(r.body) && r.body.length > 0);

  // ---- SUMMARY ----
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  RESULTS: ${pass} Passed, ${fail} Failed, ${pass + fail} Total`);
  console.log(`${'='.repeat(50)}`);
}

runTests().catch(e => console.error('FATAL:', e));
