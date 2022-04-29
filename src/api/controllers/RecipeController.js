const Recipe = require('../models/Recipe');

const checkUserMatching = (req, res, recipe) => {
  if (req.session.user.role !== 'admin' && recipe.userId.toString() !== req.session.user.id) {
    return res.status(403).json({ message: 'userId not matching' });
  }
};

class RecipeController {
  static async create(req, res) {
    const { name, ingredients, preparation } = req.body;

    try {
      const recipe = await Recipe
        .create({ name, ingredients, preparation, userId: req.session.user.id });

      return res.status(201).json({ recipe: recipe.toJSON() });
    } catch (err) {
      return res.status(400).json({ message: 'Invalid entries. Try again.' });
    }
  }

  static async find(_req, res) {
    const recipes = await Recipe.find({});

    return res.status(200).json(recipes);
  }

  static async findOne(req, res) {
    const { id } = req.params;

    try {
      const recipe = await Recipe.findById(id);

      if (!recipe) {
        return res.status(404).json({ message: 'recipe not found' });
      }

      return res.status(200).json(recipe.toJSON());
    } catch (error) {
      return res.status(500).json({ message: 'internal server error' });
    }
  }

  static async updateOne(req, res) {
    const { id } = req.params;
    const { name, ingredients, preparation } = req.body;

    try {
      const recipe = await Recipe.findOne({ _id: id });

      if (!recipe) {
        return res.status(404).json({ message: 'recipe not found' });
      }

      checkUserMatching(req, res, recipe);

      recipe.name = name;
      recipe.ingredients = ingredients;
      recipe.preparation = preparation;
      await recipe.save();

      return res.status(200).json(recipe);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  static async deleteOne(req, res) {
    const { id } = req.params;

    try {
      const recipe = await Recipe.findOne({ _id: id });

      if (!recipe) {
        return res.status(404).json({ message: 'recipe not found' });
      }

      checkUserMatching(req, res, recipe);

      await recipe.remove();

      return res.status(204).json(recipe);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  static async updateImage(req, res) {
    const { id } = req.params;
    try {
      const recipe = await Recipe.findOne({ _id: id });

      if (!recipe) {
        return res.status(404).json({ message: 'recipe not found' });
      }

      checkUserMatching(req, res, recipe);

      recipe.image = `localhost:3000/src/uploads/${id}.jpeg`;

      await recipe.save();

      return res.status(200).json(recipe);
    } catch (error) {
      return res.status(500).json(error);
    }
  }
}

module.exports = RecipeController;