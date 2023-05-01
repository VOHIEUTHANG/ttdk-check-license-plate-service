var chai = require('chai'),
  chaiHttp = require('chai-http');

chai.use(chaiHttp);

async function send(req) {
  return new Promise((resolve, reject) => {
    chai.request(process.env.VAR_BASE_URL).post(req.url).set('authorization', req.headers.authorization).send(req.data).then(resolve).catch(reject);
  });
}

module.exports = {
  send,
};
