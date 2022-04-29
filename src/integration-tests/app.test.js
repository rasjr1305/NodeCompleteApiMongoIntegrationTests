const app = require('../api/app');
const chai = require('chai');
const expect = chai.expect;

describe('App', () => {
  it('should return an express application and have "x-powered-by" enabled', async () => {
    expect(app.enabled('x-powered-by')).to.be.true;
  });
});