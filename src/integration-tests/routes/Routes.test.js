const chai = require('chai');
const expect = chai.expect;
const authRouter = require('../../api/routes/Auth');
const recipeRouter = require('../../api/routes/Recipe');
const userRouter = require('../../api/routes/User');

describe('Routes', async () => {
  const routerCheck = (router, routes) => {
    routes.forEach((route) => {
      const match = router.stack.some(
        (s) => s.route.path === route.path && s.route.methods[route.method]
      );
      expect(match).to.be.true;
    });
  };

  it('should have all Auth routes', () => {
    const routes = [
      { path: '/login', method: 'post' },
    ];

    routerCheck(authRouter, routes);
  });

  it('should have all Recipe routes', () => {
    const routes = [
      { path: '/recipes', method: 'post' },
      { path: '/recipes', method: 'get' },
      { path: '/recipes/:id', method: 'get' },
      { path: '/recipes/:id', method: 'put' },
      { path: '/recipes/:id', method: 'delete' },
      { path: '/recipes/:id/image/', method: 'put' },
    ];

    routerCheck(recipeRouter, routes);
  });

  it('should have all User routes', () => {
    const routes = [
      { path: '/users', method: 'post' },
      { path: '/users/admin', method: 'post' },
    ];

    routerCheck(userRouter, routes);
  });
});