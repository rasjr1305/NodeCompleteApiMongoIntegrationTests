const app = require('../api/server');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const User = require('../api/models/User');
const AuthService = require('../api/services/AuthService');

chai.use(chaiHttp);

const login = (createdUser) => {
  return chai
    .request(app)
    .post('/login')
    .send({ email: createdUser.email, password: createdUser.password });
}

describe('POST /login', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should generate a token if user exists', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const generatedToken = await AuthService.generateToken(createdUser);

    expect(generatedToken).to.equal(loginResponse.body.token);
  });

  it('should generate a valid token if user exists', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const decodedUser = await AuthService.validateToken(loginResponse.body.token);

    expect(decodedUser).to.be.an('object');
    expect(decodedUser).to.have.property('id', createdUser.id);
    expect(decodedUser).to.have.property('email', createdUser.email);
    expect(decodedUser).to.have.property('role', createdUser.role);
  });

  it('should not generate a token if credentials are wrong', async () => {
    await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login({ email: 'wrong@email.com', password: 'wrong' });

    expect(loginResponse.body).to.not.have.property('token');
  });

  it('should block user login if credentials are wrong', async () => {
    await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login({ email: 'wrong@email.com', password: 'wrong' });

    expect(loginResponse).have.status(401);
    expect(loginResponse.body).to.have.property('message', 'Incorrect username or password');
  });

  it('should not log in if token is malformed', async () => {
    const response = await chai
      .request(app)
      .post('/users/admin')
      .set('authorization', '123456')
      .send({
        name: 'john_doe2',
        email: 'john_doe2@email.com',
        password: '12345'
      });

    expect(response).have.status(401);
    expect(response.body).to.have.property('message', 'jwt malformed');
  });

  it('should block user login if credentials are missing', async () => {
    const loginResponse = await login({});

    expect(loginResponse).have.status(401);
    expect(loginResponse.body).to.have.property('message', 'All fields must be filled');
  });
})