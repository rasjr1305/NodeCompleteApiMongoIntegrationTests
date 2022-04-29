const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const isValid = require('../../api/middlewares/isValid');

chai.use(sinonChai);

describe('isValid', async () => {
  const res = mockRes();

  it('should continue if "id" is a valid ObjectId', async () => {
    const req = mockReq({ params: { id: '61a8185fa94a14c8c28234cb' } });

    const next = sinon.stub();

    await isValid(req, res, next);

    expect(next.calledOnce).to.be.true;
  });

  it('should return not found if "id" is not valid', async () => {
    const req = mockReq({ params: { id: '12345' } });

    const next = sinon.stub();

    await isValid(req, res, next);

    expect(res.status).to.have.been.calledWithExactly(404);
  });
});