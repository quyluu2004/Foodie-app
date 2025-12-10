import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '🍽️',
  },
  color: {
    type: String,
    default: '#FF8C42',
  },
  // Style options cho khung
  style: {
    borderStyle: {
      type: String,
      enum: ['solid', 'dashed', 'dotted', 'none'],
      default: 'solid',
    },
    borderWidth: {
      type: Number,
      default: 2,
    },
    borderColor: {
      type: String,
      default: '#FF8C42',
    },
    borderRadius: {
      type: Number,
      default: 16,
    },
    shadow: {
      enabled: {
        type: Boolean,
        default: true,
      },
      color: {
        type: String,
        default: '#000000',
      },
      opacity: {
        type: Number,
        default: 0.1,
      },
      blur: {
        type: Number,
        default: 8,
      },
    },
    backgroundGradient: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startColor: {
        type: String,
        default: '#FF8C42',
      },
      endColor: {
        type: String,
        default: '#FFA94D',
      },
    },
    // Background layer phía sau (hiệu ứng layered như trong hình)
    backgroundLayer: {
      enabled: {
        type: Boolean,
        default: true,
      },
      color: {
        type: String,
        default: '#FFE66D', // Màu vàng mặc định
      },
      offset: {
        type: Number,
        default: 8, // Khoảng cách giữa layer và card (px)
      },
      borderRadius: {
        type: Number,
        default: 20, // Bo góc của layer
      },
    },
  },
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
  }],
  order: {
    type: Number,
    default: 0,
  },
}, {
  _id: true,
  timestamps: false,
});

const homepageSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '🍽️',
  },
  color: {
    type: String,
    default: '#FF8C42',
  },
  type: {
    type: String,
    enum: ['category', 'recipe-list'],
    default: 'category',
  },
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
  }],
  subCategories: [subCategorySchema], // Mục con trong section
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.model('HomepageSection', homepageSectionSchema);

