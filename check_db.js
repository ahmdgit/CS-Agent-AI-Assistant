import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
console.log('Macros:', db.prepare('SELECT COUNT(*) as count FROM macros').get());
console.log('Updates:', db.prepare('SELECT COUNT(*) as count FROM updates').get());
console.log('Templates:', db.prepare('SELECT COUNT(*) as count FROM templates').get());
console.log('Links:', db.prepare('SELECT COUNT(*) as count FROM links').get());
