const chai = require('chai');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const RecipeController = require('../../api/controllers/RecipeController');
const User = require('../../api/models/User');
const Recipe = require('../../api/models/Recipe');
const { Types } = require('mongoose');

chai.use(sinonChai);

describe('RecipeController', async () => {
  describe('create', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should create a recipe', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

      const req = mockReq({
        body: {
          name: 'recipe01',
          ingredients: 'ing01',
          preparation: 'prep01',
        },
        session: {
          user: { id: createdUser._id }
        }
      });

      await RecipeController.create(req, res);

      expect(res.status).to.have.been.calledWithExactly(201);
      expect(res.json).to.have.been.calledWithMatch({
        recipe: {
          name: 'recipe01',
          ingredients: 'ing01',
          preparation: 'prep01',
          userId: createdUser._id,
        }
      });
    });

    it('should not create a recipe if properties are missing', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });

      const req = mockReq({ body: {} });

      await RecipeController.create(req, res);

      expect(res.status).to.have.been.calledWithExactly(400);
      expect(res.json).to.have.been.calledWithExactly({ message: 'Invalid entries. Try again.' });
    });
  });

  describe('find', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should return all recipes', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      await Recipe.insertMany([
        { name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id },
        { name: 'recipe02', ingredients: 'ingre02', preparation: 'prep02', userId: createdUser._id },
        { name: 'recipe03', ingredients: 'ingre03', preparation: 'prep03', userId: createdUser._id },
      ]);

      const req = mockReq();

      await RecipeController.find(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
    });
  });

  describe('findOne', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should return a recipe by id', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const recipeProps = { name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id };
      const createdRecipe = await Recipe.create(recipeProps);

      const req = mockReq({
        params: {
          id: createdRecipe.id,
        }
      });

      await RecipeController.findOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
      expect(res.json).to.have.been.calledWithMatch(recipeProps);
    });

    it('should return not found if recipe does not exist', async () => {
      const req = mockReq({ params: { id: '61a8185fa94a14c8c28234cb' } });

      await RecipeController.findOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(404);
      expect(res.json).to.have.been.calledWithExactly({ message: 'recipe not found' });
    });
  });

  describe('updateOne', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should update a recipe by id if "userId" is same as logged in user id', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        body: {
          name: 'recipe01x',
          ingredients: 'ing01x',
          preparation: 'prep01x',
        },
        session: { user: { id: createdUser.id } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
      expect(res.json).to.have.been.calledWithMatch({
        name: 'recipe01x',
        ingredients: 'ing01x',
        preparation: 'prep01x',
        userId: createdUser._id
      });
    });

    it('should update a recipe by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        body: {
          name: 'recipe01x',
          ingredients: 'ing01x',
          preparation: 'prep01x',
        },
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
      expect(res.json).to.have.been.calledWithMatch({
        name: 'recipe01x',
        ingredients: 'ing01x',
        preparation: 'prep01x',
        userId: createdUser._id
      });
    });

    it('should update a recipe by id if logged in as "admin" and "userId" is matching with logged user', async () => {
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUserAdmin._id });

      const req = mockReq({
        body: {
          name: 'recipe01x',
          ingredients: 'ing01x',
          preparation: 'prep01x',
        },
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
      expect(res.json).to.have.been.calledWithMatch({
        name: 'recipe01x',
        ingredients: 'ing01x',
        preparation: 'prep01x',
        userId: createdUserAdmin._id
      });
    });

    it('should not update a recipe by id if user is not logged in', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        body: {
          name: 'recipe01x',
          ingredients: 'ing01x',
          preparation: 'prep01x',
        },
        session: {},
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(500);
    });

    it('should return not found if recipe does not exist', async () => {
      const req = mockReq({
        params: { id: new Types.ObjectId() }
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(404);
      expect(res.json).to.have.been.calledWithExactly({ message: 'recipe not found' });
    });

    it('should block if "userId" is not matching', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        body: {
          name: 'recipe01x',
          ingredients: 'ing01x',
          preparation: 'prep01x',
        },
        session: { user: { id: new Types.ObjectId() } },
        params: { id: createdRecipe.id },
      });

      await RecipeController.updateOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(403);
      expect(res.json).to.have.been.calledWithExactly({ message: 'userId not matching' });
    });
  });

  describe('deleteOne', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should delete a recipe by id if "userId" is same as logged in user id', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: createdUser.id } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(204);
    });

    it('should delete a recipe by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(204);
    });

    it('should delete a recipe by id if logged in as "admin" and "userId" is matching with logged user', async () => {
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUserAdmin._id });

      const req = mockReq({
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(204);
    });

    it('should not delete a recipe by id if user is not logged in', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: {},
        params: { id: createdRecipe.id }
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(500);
    });

    it('should return not found if recipe does not exist', async () => {
      const req = mockReq({
        params: { id: new Types.ObjectId() }
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(404);
      expect(res.json).to.have.been.calledWithExactly({ message: 'recipe not found' });
    });

    it('should block if "userId" is not matching', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: new Types.ObjectId() } },
        params: { id: createdRecipe.id },
      });

      await RecipeController.deleteOne(req, res);

      expect(res.status).to.have.been.calledWithExactly(403);
      expect(res.json).to.have.been.calledWithExactly({ message: 'userId not matching' });
    });
  });

  describe('updateImage', async () => {
    const res = mockRes();

    beforeEach(async () => {
      await User.deleteMany({});
      await Recipe.deleteMany({});
    });

    afterEach(() => {
      res.json.resetHistory();
      res.status.resetHistory();
    })

    it('should update a recipe image by id if "userId" is same as logged in user id', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: createdUser.id } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
    });

    it('should update a recipe image by id if logged in as "admin" and "userId" is not matching with logged user', async () => {
      const createdUser = await User.create({ email: 'john_doe@email.com', name: 'john_doe', password: '12345' });
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
    });

    it('should update a recipe image by id if logged in as "admin" and "userId" is matching with logged user', async () => {
      const createdUserAdmin = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUserAdmin._id });

      const req = mockReq({
        session: { user: { id: createdUserAdmin.id, role: 'admin' } },
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(200);
    });

    it('should not update a recipe image by id if user is not logged in', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: {},
        params: { id: createdRecipe.id }
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(500);
    });

    it('should return not found if recipe does not exist', async () => {
      const req = mockReq({
        params: { id: new Types.ObjectId() }
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(404);
      expect(res.json).to.have.been.calledWithExactly({ message: 'recipe not found' });
    });

    it('should block if "userId" is not matching', async () => {
      const createdUser = await User.create({ email: 'john_doeadmin@email.com', name: 'john_doeadmin', password: '12345', role: 'admin' });
      const createdRecipe = await Recipe.create({ name: 'recipe01', ingredients: 'ingre01', preparation: 'prep01', userId: createdUser._id });

      const req = mockReq({
        session: { user: { id: new Types.ObjectId() } },
        params: { id: createdRecipe.id },
      });

      await RecipeController.updateImage(req, res);

      expect(res.status).to.have.been.calledWithExactly(403);
      expect(res.json).to.have.been.calledWithExactly({ message: 'userId not matching' });
    });
  });
});