const app = require('../api/server');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe('GET /', () => {
  it('should test the reviewer bootstrap route', async () => {
    const response = await chai
      .request(app)
      .get('/');

    expect(response).have.status(200);
  });
});