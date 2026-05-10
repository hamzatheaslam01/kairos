const fs = require('fs');
const https = require('https');
const path = require('path');

const urls = {
  hero: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzEwMTc5MDdkMjNjYzQ3MjU5YzIwNGJmMTlkZmNkODQ5EgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  auth: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzYxNTRhYThlZWIwYjRkMGZiMDdhZjA5OThmNTJhYzBhEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  event_input: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y1YTcxODkzZGJiNzQ4OWU4NjM5YTllMjIwODg5MWFlEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  recommendations: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRiYWE3NWUxMzRiYTQ1NTBiNTg4MGM3ODBjNWRkZjVjEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  booking: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI3NjQxNjJiNDg4YzQ1OTFhNzEyYjU1ZTQyN2IyMDUzEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  ai_chat: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzliNmM3NGUyNGY1NDQ4YmY4Y2YyN2E0YjBmYjYwZGExEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  history: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzNkYTBiYzAwZjMzNTRjODg5MWNlMGYxZDIwNWM3MWU0EgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  create_exp: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk5MzAyMzBjMGY2YzQ1ZmNhYzM1MmNhNzI1YjQ5OWNhEgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086',
  admin: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBjZTIwMGFjNmNhMjRiNDY5ZDdlNWExNDFjYjgzZGQ0EgsSBxDzz_qykxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTM4MzQyOTE0OTI4MDY1NjY2MQ&filename=&opi=89354086'
};

const dir = path.join(__dirname, 'client', 'src', 'stitch');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

Object.entries(urls).forEach(([name, url]) => {
  const filePath = path.join(dir, `${name}.html`);
  https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      fs.writeFileSync(filePath, rawData);
      console.log(`Saved ${name}.html`);
    });
  }).on('error', (e) => {
    console.error(`Error downloading ${name}: ${e.message}`);
  });
});
