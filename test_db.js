const db = require('./db');

async function checkDB() {
  db.query('SELECT user_id, username, role, position, email, is_active, customer_id FROM users', (err, users) => {
    console.log('=== USERS TABLE ===');
    if(err) console.error('Error:', err.message);
    else console.log(JSON.stringify(users, null, 2));
  });

  db.query('DESCRIBE customer', (err, cols) => {
    console.log('\n=== CUSTOMER TABLE SCHEMA ===');
    if(err) console.error('Error:', err.message);
    else cols.forEach(c => console.log(c.Field, c.Type, 'NULL:'+c.Null, 'KEY:'+c.Key));
  });
  
  db.query('DESCRIBE account', (err, cols) => {
    console.log('\n=== ACCOUNT TABLE SCHEMA ===');
    if(err) console.error('Error:', err.message);
    else cols.forEach(c => console.log(c.Field, c.Type, 'NULL:'+c.Null, 'KEY:'+c.Key));
  });
  
  db.query('SELECT * FROM account', (err, accs) => {
    console.log('\n=== ACCOUNTS ===');
    if(err) console.error('Error:', err.message);
    else console.log(JSON.stringify(accs, null, 2));
  });
  
  db.query('DESCRIBE transactions', (err, cols) => {
    console.log('\n=== TRANSACTIONS TABLE SCHEMA ===');
    if(err) console.error('Error:', err.message);
    else cols.forEach(c => console.log(c.Field, c.Type, 'NULL:'+c.Null, 'DEFAULT:'+c.Default));
  });

  db.query('SHOW TRIGGERS FROM bank_db', (err, triggers) => {
    console.log('\n=== TRIGGERS ===');
    if(err) console.error('Error:', err.message);
    else triggers.forEach(t => console.log(t.Trigger + ': ' + t.Event + ' on ' + t.Table));
    setTimeout(() => process.exit(0), 500);
  });
}

checkDB();
