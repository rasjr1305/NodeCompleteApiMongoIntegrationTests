const app = require('../api/server');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const User = require('../api/models/User');
const Recipe = require('../api/models/Recipe');
const fs = require('fs');
const path = require('path');

chai.use(chaiHttp);

const login = (createdUser) => {
  return chai
    .request(app)
    .post('/login')
    .send({ email: createdUser.email, password: createdUser.password });
}

describe('POST /recipes', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should create a recipe if user is logged in', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .post('/recipes')
      .set('authorization', loginResponse.body.token)
      .send({ name: 'recipe01', ingredients: 'ing01', preparation: 'prep01' });

    expect(recipeResponse).have.status(201);
    expect(recipeResponse.body.recipe).to.be.an('object');
    expect(recipeResponse.body.recipe).to.have.property('_id');
    expect(recipeResponse.body.recipe).to.have.property('name', 'recipe01');
    expect(recipeResponse.body.recipe).to.have.property('ingredients', 'ing01');
    expect(recipeResponse.body.recipe).to.have.property('preparation', 'prep01');
    expect(recipeResponse.body.recipe).to.have.property('userId', createdUser.id);
  });

  it('should not create a recipe if user is not logged in', async () => {
    const recipeResponse = await chai
      .request(app)
      .post('/recipes')
      .send({ name: 'recipe01', ingredients: 'ing01', preparation: 'prep01' });

    expect(recipeResponse).have.status(401);
  });

  it('should not create a recipe if properties are missing', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .post('/recipes')
      .set('authorization', loginResponse.body.token)
      .send({});

    expect(recipeResponse).have.status(400);
    expect(recipeResponse.body).to.have.property('message', 'Invalid entries. Try again.');
  });
})

describe('GET /recipes', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should return all recipes', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    await Recipe.insertMany([
      { name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id },
      { name: 'recipe02', ingredients: 'ingre02', preparation: 'prep02', userId: createdUser.id },
      { name: 'recipe03', ingredients: 'ingre03', preparation: 'prep03', userId: createdUser.id },
    ]);

    const recipeResponse = await chai
      .request(app)
      .get('/recipes');

    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('array');
    expect(recipeResponse.body).to.have.length(3);
  });
})

describe('GET /recipes/:id', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should return a recipe by id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const recipeResponse = await chai
      .request(app)
      .get(`/recipes/${createdRecipe.id}`);

    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', createdRecipe.name);
    expect(recipeResponse.body).to.have.property('ingredients', createdRecipe.ingredients);
    expect(recipeResponse.body).to.have.property('preparation', createdRecipe.preparation);
    expect(recipeResponse.body).to.have.property('userId', createdRecipe.userId.toString());
  });

  it('should return not found if recipe does not exist', async () => {
    const recipeResponse = await chai
      .request(app)
      .get(`/recipes/12345`);

    expect(recipeResponse).have.status(404);
    expect(recipeResponse.body).to.have.property('message', 'recipe not found');
  });
})

describe('PUT /recipes/:id', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should update a recipe by id if "userId" is same as logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', 'updatedRecipe');
    expect(recipeResponse.body).to.have.property('ingredients', 'updatedIngredients');
    expect(recipeResponse.body).to.have.property('preparation', 'updatedPreparation');
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should update a recipe by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUserAdmin = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUserAdmin);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', 'updatedRecipe');
    expect(recipeResponse.body).to.have.property('ingredients', 'updatedIngredients');
    expect(recipeResponse.body).to.have.property('preparation', 'updatedPreparation');
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should update a recipe by id if logged in as "admin" and "userId" is matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', 'updatedRecipe');
    expect(recipeResponse.body).to.have.property('ingredients', 'updatedIngredients');
    expect(recipeResponse.body).to.have.property('preparation', 'updatedPreparation');
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should not update a recipe by id if user is not logged in', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}`)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(401);
  });

  it('should not update a recipe by id if "userId" is not matching with logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUser02 = await User.create({ email: 'john_doe2@email.com', name: 'john_doe2', password: '12345' });

    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser02.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(403);
    expect(recipeResponse.body).to.have.property('message', 'userId not matching');
  });

  it('should return not found if recipe does not exist', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/61a50fa818310e7bc3b7732e`)
      .set('authorization', loginResponse.body.token)
      .send({ name: 'updatedRecipe', ingredients: 'updatedIngredients', preparation: 'updatedPreparation' });

    expect(recipeResponse).have.status(404);
    expect(recipeResponse.body).to.have.property('message', 'recipe not found');
  });
})

describe('DELETE /recipes/:id', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should delete a recipe by id if "userId" is same as logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(204);
    expect(recipeResponse.body).to.be.empty;
  });

  it('should delete a recipe by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUserAdmin = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUserAdmin);

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(204);
    expect(recipeResponse.body).to.be.empty;
  });

  it('should delete a recipe by id if logged in as "admin" and "userId" is matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(204);
    expect(recipeResponse.body).to.be.empty;
  });

  it('should not delete a recipe by id if user is not logged in', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/${createdRecipe.id}`);

    expect(recipeResponse).have.status(401);
  });

  it('should not delete a recipe by id if "userId" is not matching with logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUser02 = await User.create({ email: 'john_doe2@email.com', name: 'john_doe2', password: '12345' });

    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser02.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/${createdRecipe.id}`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(403);
    expect(recipeResponse.body).to.have.property('message', 'userId not matching');
  });

  it('should return not found if recipe does not exist', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .delete(`/recipes/12345`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(404);
    expect(recipeResponse.body).to.have.property('message', 'recipe not found');
  });
})

describe('PUT /recipes/:id/image', () => {
  beforeEach(async () => {
    await Recipe.deleteMany({});
    await User.deleteMany({});
  });

  it('should update a recipe image by id if "userId" is same as logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const photoFile = path.resolve(__dirname, '..', 'uploads', 'ratinho.jpg');

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`)
      .set('Content-Type', 'application/multipart/form-data')
      .set('authorization', loginResponse.body.token)
      .attach('image', fs.readFileSync(photoFile), `${createdRecipe.id}.jpeg`);

    const uploadedPhotoFile = path.resolve(__dirname, '..', 'uploads', `${createdRecipe.id}.jpeg`);
    const uploadedFileExists = fs.existsSync(uploadedPhotoFile);

    expect(uploadedFileExists).to.be.true;
    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', createdRecipe.name);
    expect(recipeResponse.body).to.have.property('ingredients', createdRecipe.ingredients);
    expect(recipeResponse.body).to.have.property('preparation', createdRecipe.preparation);
    expect(recipeResponse.body).to.have.property('image', `localhost:3000/src/uploads/${createdRecipe.id}.jpeg`);
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should update a recipe image by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUserAdmin = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUserAdmin);

    const photoFile = path.resolve(__dirname, '..', 'uploads', 'ratinho.jpg');

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`)
      .set('Content-Type', 'application/multipart/form-data')
      .set('authorization', loginResponse.body.token)
      .attach('image', fs.readFileSync(photoFile), `${createdRecipe.id}.jpeg`);

    const uploadedPhotoFile = path.resolve(__dirname, '..', 'uploads', `${createdRecipe.id}.jpeg`);
    const uploadedFileExists = fs.existsSync(uploadedPhotoFile);

    expect(uploadedFileExists).to.be.true;
    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', createdRecipe.name);
    expect(recipeResponse.body).to.have.property('ingredients', createdRecipe.ingredients);
    expect(recipeResponse.body).to.have.property('preparation', createdRecipe.preparation);
    expect(recipeResponse.body).to.have.property('image', `localhost:3000/src/uploads/${createdRecipe.id}.jpeg`);
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should update a recipe image by id if logged in as "admin" and "userId" is matching with logged user', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345', role: 'admin' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const photoFile = path.resolve(__dirname, '..', 'uploads', 'ratinho.jpg');

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`)
      .set('Content-Type', 'application/multipart/form-data')
      .set('authorization', loginResponse.body.token)
      .attach('image', fs.readFileSync(photoFile), `${createdRecipe.id}.jpeg`);

    const uploadedPhotoFile = path.resolve(__dirname, '..', 'uploads', `${createdRecipe.id}.jpeg`);
    const uploadedFileExists = fs.existsSync(uploadedPhotoFile);

    expect(uploadedFileExists).to.be.true;
    expect(recipeResponse).have.status(200);
    expect(recipeResponse.body).to.be.an('object');
    expect(recipeResponse.body).to.have.property('_id', createdRecipe.id);
    expect(recipeResponse.body).to.have.property('name', createdRecipe.name);
    expect(recipeResponse.body).to.have.property('ingredients', createdRecipe.ingredients);
    expect(recipeResponse.body).to.have.property('preparation', createdRecipe.preparation);
    expect(recipeResponse.body).to.have.property('image', `localhost:3000/src/uploads/${createdRecipe.id}.jpeg`);
    expect(recipeResponse.body).to.have.property('userId', createdUser.id.toString());
  });

  it('should not update a recipe image by id if user is not logged in', async () => {
    const createdUser = await User.create({ email: 'john_doe_admin@email.com', name: 'john_doe_admin', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`);

    expect(recipeResponse).have.status(401);
  });

  it('should not update a recipe image by id if "userId" is not matching with logged in user id', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdUser02 = await User.create({ email: 'john_doe2@email.com', name: 'john_doe2', password: '12345' });

    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser02.id });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(403);
    expect(recipeResponse.body).to.have.property('message', 'userId not matching');
  });

  it('should return not found image if recipe does not exist', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

    const loginResponse = await login(createdUser);

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/61a50fa818310e7bc3b7732e/image`)
      .set('authorization', loginResponse.body.token);

    expect(recipeResponse).have.status(404);
    expect(recipeResponse.body).to.have.property('message', 'recipe not found');
  });

  it('should not update a recipe image by id if image extension is not jpeg/jpg', async () => {
    const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
    const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser.id });

    const loginResponse = await login(createdUser);

    const photoFile = path.resolve(__dirname, '..', 'uploads', 'ratinho2.png');

    const recipeResponse = await chai
      .request(app)
      .put(`/recipes/${createdRecipe.id}/image`)
      .set('Content-Type', 'application/multipart/form-data')
      .set('authorization', loginResponse.body.token)
      .attach('image', fs.readFileSync(photoFile), `${createdRecipe.id}.png`);

    const uploadedPhotoFile = path.resolve(__dirname, '..', 'uploads', `${createdRecipe.id}.png`);
    const uploadedFileExists = fs.existsSync(uploadedPhotoFile);

    expect(recipeResponse).have.status(500);
    expect(uploadedFileExists).to.be.false;
  });
})