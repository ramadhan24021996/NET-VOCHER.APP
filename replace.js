import fs from 'fs';
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/'http:\/\/localhost:3001(\/[^']*)'/g, '`http://${window.location.hostname}:3001$1`');
fs.writeFileSync(file, content);
console.log('Replaced localhost:3001 with generic hostname');
