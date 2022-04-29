const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const AuthService = require('../../api/services/AuthService');
const isLoggedIn = require('../../api/middlewares/isLoggedIn');

chai.use(sinonChai);

describe('isLoggedIn', async () => {
  const res = mockRes();

  it('should log in a user with a valid token', async () => {
    const req = mockReq({
      headers: {
        authorization: await AuthService.generateToken({ email: 'john_doe@email.com', password: '12345', role: 'user' })
      },
      session: {},
    });

    const next = sinon.stub();

    await isLoggedIn(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it('should return missing auth token if "authorization" header is not set', async () => {
    const req = mockReq({
      headers: {},
      session: {},
    });

    const next = sinon.stub();

    await isLoggedIn(req, res, next);

    expect(res.status).to.have.been.calledWithExactly(401);
    expect(res.json).to.have.been.calledWithExactly({ message: 'missing auth token' });
  });

  it('should block logging in if jwt malformed', async () => {
    const req = mockReq({
      headers: {
        authorization: '123456',
      },
      session: {},
    });

    const next = sinon.stub();

    await isLoggedIn(req, res, next);

    expect(res.status).to.have.been.calledWithExactly(401);
    expect(res.json).to.have.been.calledWithExactly({ message: 'jwt malformed' });
  });
});