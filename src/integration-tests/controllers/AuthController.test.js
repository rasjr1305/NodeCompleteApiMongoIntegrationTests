const chai = require('chai');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const AuthController = require('../../api/controllers/AuthController');
const AuthService = require('../../api/services/AuthService');
const User = require('../../api/models/User');

chai.use(sinonChai);

describe('AuthController', async () => {
  describe('login', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should generate a token if user exists', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

      const req = mockReq({
        body: {
          email: 'john_doe@email.com',
          password: '12345',
        },
      });

      await AuthController.login(req, res);

      const token = await AuthService.generateToken(createdUser);

      expect(res.json).to.have.been.calledWith({ token });
    });

    it('should block user login if credentials are wrong', async () => {
      await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

      const req = mockReq({
        body: {
          email: 'wrong@email.com',
          password: 'wrong',
        },
      });

      await AuthController.login(req, res);

      expect(res.status).to.have.been.calledWithExactly(401);
      expect(res.json).to.have.been.calledWithExactly({ message: 'Incorrect username or password' });
    });

    it('should block user login if credentials are missing', async () => {
      const req = mockReq({ body: {} });

      await AuthController.login(req, res);

      expect(res.status).to.have.been.calledWithExactly(401);
      expect(res.json).to.have.been.calledWithExactly({ message: 'All fields must be filled' });
    });
  });
});