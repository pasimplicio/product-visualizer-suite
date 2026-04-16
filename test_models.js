const http = require('https');
const key = require('fs').readFileSync('.env', 'utf8').match(/VITE_GEMINI_API_KEY=(.+)/)[1].trim();

const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image', 'imagen-4.0-generate-001', 'imagen-4.0-fast-generate-001'];
const body = JSON.stringify({
  contents: [{parts: [{text: 'apple'}]}],
  generationConfig: { responseModalities: ['IMAGE'] }
});

Promise.all(models.map(model => new Promise((resolve) => {
  const req = http.request({
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models/' + model + ':generateContent?key=' + key,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      if (data.includes('error')) resolve(model + ' ERROR: ' + JSON.parse(data).error.message);
      else resolve(model + ' SUCCESS');
    });
  });
  req.write(body);
  req.end();
}))).then(console.log);
