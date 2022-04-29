const { Types } = require('mongoose');
const mongoose = require('../../database');

const RecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ingredients: { type: String, required: true },
    preparation: { type: String, required: true },
    image: { type: String },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
  },
);

RecipeSchema.set('toJSON', { versionKey: false });

const Recipe = mongoose.model('Recipe', RecipeSchema);

module.exports = Recipe;