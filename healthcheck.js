import http from 'http';

const options = {
    method: 'GET',
    host: 'localhost',
    port: process.env.PORT || 4000,
    path: '/graphql\?query\=%7B__typename%7D',
    headers: { 'apollo-require-preflight': "true" },
    timeout: 500
};

const request = http.request(options, (res) => {
    console.info('STATUS: ' + res.statusCode);
    process.exitCode = (res.statusCode === 200) ? 0 : 1;
    process.exit();
});

request.on('error', function (err) {
    console.error('ERROR', err);
    process.exit(1);
});

request.end();
