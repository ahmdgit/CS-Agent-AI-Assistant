import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
console.log('Macros:', db.prepare('SELECT * FROM macros').all());
console.log('Updates:', db.prepare('SELECT * FROM updates').all());
console.log('Templates:', db.prepare('SELECT * FROM templates').all());
console.log('Links:', db.prepare('SELECT * FROM links').all());
