const Category = require('../models/Category');

const addCategory = async (categoryBody) => {
  try {
    var category = await getCategoryByName(categoryBody.name);
    if (category) {
      return null;
    }
    category = new Category(categoryBody);
    await category.save();
    return category;
  } catch (error) {
    throw error;
  }
}

const getCategoryById = async (id) => {
  return await Category.findById(id);
}

const getCategoryWithAccessStatus = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const pageEr = Number(options.pageEr) || 1;
  const limitEr = Number(options.limitEr) || 10;
  const skipEr = (pageEr - 1) * limitEr;

  const categoryList = await Category.aggregate([
    // Match all documents
    {
      $match: {}
    },
    // Lookup categories from questions
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: 'category',
        as: 'questions'
      }
    },
    // Project necessary fields
    {
      $project: {
        _id: 1,
        name: 1,
        nameGr: 1,
        type: 1,
        isEarlyAccessAvailable: 1,
        image: 1,
        questionCount: { $size: "$questions" }
      }
    },
    // Skip and limit for pagination
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);


  const totalResults = await Category.countDocuments();
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  var earlyAccessList = [];
  var paginationEr = {};

  if(filter.isEarlyAccessAvailable){
    earlyAccessList = await Category.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "category",
          as: "questions"
        }
      },
      {
        $match: {
          "questions.isEarlyAccessAvailable": true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          nameGr: 1,
          type: 1,
          image: 1
        }
      },
      {
        $skip: skipEr
      },
      {
        $limit: limitEr
      }
    ]);
  
    const totalResultsEr = await Category.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "category",
          as: "questions"
        }
      },
      {
        $match: {
          "questions.isEarlyAccessAvailable": true
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);
    const count = totalResultsEr[0]?.count !== undefined ? totalResultsEr[0].count : 0;
    const totalPagesEr = Math.ceil(count / limitEr);
    paginationEr = { totalResults: count, totalPages: totalPagesEr, currentPage: pageEr, limit: limitEr };
  }

  return { categoryList, pagination, earlyAccessList, paginationEr };
}

const getCategoryByName = async (name) => {
  return await Category.findOne({ name: name });
}

const getAllCategorys = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  var isEarlyAccessAvailable = filter.accessStatus === 'true' ? true : false;

  console.log(isEarlyAccessAvailable);
  const categoryList = await Category.aggregate([
    // Match all documents
    {
      $match: {}
    },
    // Lookup categories from questions
    {
      $lookup: {
        from: 'questions',
        let: { categoryId: '$_id', isEarlyAccessAvailableOrNot: isEarlyAccessAvailable },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$category', '$$categoryId'] },
                  { $eq: ['$isEarlyAccessAvailable', '$$isEarlyAccessAvailableOrNot'] }
                ]
              }
            }
          }
        ],
        as: 'allQuestions'
      }
    },
    // Project necessary fields
    {
      $project: {
        _id: 1,
        name: 1,
        nameGr: 1,
        type: 1,
        isEarlyAccessAvailable: 1,
        image: 1,
        questionCount: { $size: "$allQuestions" }
      }
    },
    // Skip and limit for pagination
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  const totalResults = await Category.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  return { categoryList, pagination };
}


const updateCategory = async (categoryId, categorybody) => {
  try {
    return await Category.findByIdAndUpdate(categoryId, categorybody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

const deleteCategory = async (categoryId) => {
  try {
    return await Category.findByIdAndDelete(categoryId);
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addCategory,
  getCategoryById,
  updateCategory,
  getCategoryByName,
  getAllCategorys,
  deleteCategory,
  getCategoryWithAccessStatus
}
