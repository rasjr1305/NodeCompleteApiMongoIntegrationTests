const app = require('../api/server');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const User = require('../api/models/User');

chai.use(chaiHttp);

const login = (createdUser) => {
  return chai
    .request(app)
    .post('/login')
    .send({ email: createdUser.email, password: createdUser.password });
}

describe('POST /users', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a user', async () => {
    const response = await chai
      .request(app)
      .post('/users')
      .send({
        name: 'john_doe',
        email: 'john_doe@email.com',
        password: '12345'
      });

    expect(response).have.status(201);
    expect(response.body.user).to.be.an('object');
    expect(response.body.user).to.have.property('_id');
    expect(response.body.user).to.have.property('name', 'john_doe');
    expect(response.body.user).to.have.property('email', 'john_doe@email.com');
    expect(response.body.user).to.have.property('role', 'user');
    expect(response.body.user).to.not.have.property('password');
  });

  it('should create a user if logged in as "user"', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const response = await chai
      .request(app)
      .post('/users')
      .set('authorization', loginResponse.body.token)
      .send({
        name: 'john_doe2',
        email: 'john_doe2@email.com',
        password: '12345'
      });

    expect(response).have.status(201);
    expect(response.body.user).to.be.an('object');
    expect(response.body.user).to.have.property('_id');
    expect(response.body.user).to.have.property('name', 'john_doe2');
    expect(response.body.user).to.have.property('email', 'john_doe2@email.com');
    expect(response.body.user).to.have.property('role', 'user');
    expect(response.body.user).to.not.have.property('password');
  });

  it('should create a user if logged in as "admin"', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345', role: 'admin' });

    const loginResponse = await login(createdUser);

    const response = await chai
      .request(app)
      .post('/users')
      .set('authorization', loginResponse.body.token)
      .send({
        name: 'john_doe2',
        email: 'john_doe2@email.com',
        password: '12345'
      });

    expect(response).have.status(201);
    expect(response.body.user).to.be.an('object');
    expect(response.body.user).to.have.property('_id');
    expect(response.body.user).to.have.property('name', 'john_doe2');
    expect(response.body.user).to.have.property('email', 'john_doe2@email.com');
    expect(response.body.user).to.have.property('role', 'user');
    expect(response.body.user).to.not.have.property('password');
  });

  it('should create an admin if logged in as "admin" role', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345', role: 'admin' });

    const loginResponse = await login(createdUser);

    const response = await chai
      .request(app)
      .post('/users/admin')
      .set('authorization', loginResponse.body.token)
      .send({
        name: 'john_doe2',
        email: 'john_doe2@email.com',
        password: '12345'
      });

    expect(response).have.status(201);
    expect(response.body.user).to.be.an('object');
    expect(response.body.user).to.have.property('_id');
    expect(response.body.user).to.have.property('name', 'john_doe2');
    expect(response.body.user).to.have.property('email', 'john_doe2@email.com');
    expect(response.body.user).to.have.property('role', 'admin');
    expect(response.body.user).to.not.have.property('password');
  });

  it('should not create an admin if logged in as "user" role', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const response = await chai
      .request(app)
      .post('/users/admin')
      .set('authorization', loginResponse.body.token)
      .send({
        name: 'john_doe_admin2',
        email: 'john_doe_admin2@email.com',
        password: '12345'
      });

    expect(response).have.status(403);
    expect(response.body).to.have.property('message', 'Only admins can register new admins');
  });

  it('should block user creation if email is already registered', async () => {
    await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const response = await chai
      .request(app)
      .post('/users')
      .send({
        name: 'john_doe2',
        email: 'john_doe@email.com',
        password: '12345'
      });

    expect(response).have.status(409);
    expect(response.body).to.have.property('message', 'Email already registered');
  });

  it('should block user creation if "name", "email" and "password" properties are not passed', async () => {
    const response = await chai
      .request(app)
      .post('/users')
      .send({});

    expect(response).have.status(400);
    expect(response.body).to.have.property('message', 'Invalid entries. Try again.');
  });
})