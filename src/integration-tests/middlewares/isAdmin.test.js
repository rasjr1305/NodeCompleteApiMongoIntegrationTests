const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const isAdmin = require('../../api/middlewares/isAdmin');

chai.use(sinonChai);

describe('isAdmin', async () => {
  const res = mockRes();

  it('should log in a user with a "admin" role', async () => {
    const req = mockReq({
      session: {
        user: { role: 'admin' }
      },
    });

    const next = sinon.stub();

    await isAdmin(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it('should login only admins', async () => {
    const req = mockReq({
      session: {
        user: { role: 'user' }
      },
    });

    const next = sinon.stub();

    await isAdmin(req, res, next);

    expect(res.status).to.have.been.calledWithExactly(403);
    expect(res.json).to.have.been.calledWithExactly({ message: 'Only admins can register new admins' });
  });
});