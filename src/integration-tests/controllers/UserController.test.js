const chai = require('chai');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const UserController = require('../../api/controllers/UserController');
const User = require('../../api/models/User');

chai.use(sinonChai);

describe('UserController', async () => {
  const res = mockRes();

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterEach(() => {
    res.json.resetHistory();
    res.status.resetHistory();
  })

  it('should create a user', async () => {
    const req = mockReq({
      body: {
        email: 'john_doe@email.com',
        name: 'john_doe',
        password: '12345',
      },
    });

    await UserController.create(req, res);

    expect(res.status).to.have.been.calledWithExactly(201);
    expect(res.json).to.have.been.calledWithMatch({
      user: {
        email: 'john_doe@email.com',
        name: 'john_doe',
        role: 'user',
      }
    });
  });

  it('should create a user with role "admin"', async () => {
    const req = mockReq({
      body: {
        email: 'john_doe@email.com',
        name: 'john_doe',
        password: '12345',
      },
      path: '/users/admin',
    });

    await UserController.create(req, res);

    expect(res.status).to.have.been.calledWithExactly(201);
    expect(res.json).to.have.been.calledWithMatch({
      user: {
        email: 'john_doe@email.com',
        name: 'john_doe',
        role: 'admin'
      }
    });
  });

  it('should not create a user with the same email', async () => {
    await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const req = mockReq({
      body: {
        email: 'john_doe@email.com',
        name: 'john_doe',
        password: '12345',
      },
    });

    await UserController.create(req, res);

    expect(res.status).to.have.been.calledWithExactly(409);
    expect(res.json).to.have.been.calledWithExactly({ message: 'Email already registered' });
  });

  it('should block user creation if "name", "email" and "password" properties are not passed', async () => {
    await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const req = mockReq({ body: {} });

    await UserController.create(req, res);

    expect(res.status).to.have.been.calledWithExactly(400);
    expect(res.json).to.have.been.calledWithExactly({ message: 'Invalid entries. Try again.' });
  });
});