/**
 * Test data fixtures for consistent testing
 */

export const userFixtures = {
  validUser: {
    id: process.env.E2E_USERNAME_ID!,
    email: process.env.E2E_USERNAME!,
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z'
  },
  adminUser: {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  newUser: {
    email: 'newuser@example.com',
    name: 'New User',
    password: 'password123'
  }
}

export const setFixtures = {
  emptySet: {
    id: 'set-1',
    name: 'Empty Set',
    description: 'A set with no cards',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    cards: []
  },
  populatedSet: {
    id: 'set-2',
    name: 'React Basics',
    description: 'Basic React concepts',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    cards: [
      {
        id: 'card-1',
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces',
        set_id: 'set-2',
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'card-2',
        front: 'What is JSX?',
        back: 'A syntax extension for JavaScript that looks similar to HTML',
        set_id: 'set-2',
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  largeSet: {
    id: 'set-3',
    name: 'Large Set',
    description: 'A set with many cards',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    cards: Array.from({ length: 50 }, (_, i) => ({
      id: `card-${i + 1}`,
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
      set_id: 'set-3',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }))
  }
}

export const cardFixtures = {
  simpleCard: {
    id: 'card-1',
    front: 'What is TypeScript?',
    back: 'A typed superset of JavaScript that compiles to plain JavaScript',
    set_id: 'set-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  longCard: {
    id: 'card-2',
    front: 'Explain the concept of closures in JavaScript',
    back: 'A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned. This is a fundamental concept in JavaScript that allows for data privacy and the creation of function factories.',
    set_id: 'set-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  newCard: {
    front: 'What is the virtual DOM?',
    back: 'A virtual representation of the real DOM that React uses to optimize updates'
  }
}

export const generationFixtures = {
  sampleText: 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React uses a virtual DOM to efficiently update the user interface.',
  longText: 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React uses a virtual DOM to efficiently update the user interface. Components are the building blocks of React applications. They are reusable pieces of UI that can be composed together to create complex interfaces. Props are used to pass data from parent components to child components. State is used to manage data that can change over time within a component. Hooks are functions that let you use state and other React features in functional components.',
  shortText: 'React is a library.',
  invalidText: '', // Empty text
  tooLongText: 'a'.repeat(15000) // Exceeds 10k character limit
}

export const apiResponseFixtures = {
  successResponse: {
    success: true,
    data: null,
    message: 'Operation completed successfully'
  },
  errorResponse: {
    success: false,
    error: 'Something went wrong',
    message: 'An error occurred'
  },
  validationError: {
    success: false,
    error: 'Validation failed',
    details: {
      email: 'Email is required',
      password: 'Password must be at least 8 characters'
    }
  },
  notFoundError: {
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  },
  unauthorizedError: {
    success: false,
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource'
  }
}

export const formFixtures = {
  validSignIn: {
    email: process.env.E2E_USERNAME!,
    password: process.env.E2E_PASSWORD!
  },
  invalidSignIn: {
    email: 'invalid-email',
    password: '123'
  },
  validSignUp: {
    email: 'newuser@example.com',
    name: 'New User',
    password: 'password123',
    confirmPassword: 'password123'
  },
  invalidSignUp: {
    email: 'invalid-email',
    name: '',
    password: '123',
    confirmPassword: '456'
  },
  validSet: {
    name: 'Test Set',
    description: 'A test set for flash cards'
  },
  invalidSet: {
    name: '',
    description: 'A'.repeat(1000) // Too long description
  }
}

export const uiFixtures = {
  themes: ['light', 'dark', 'system'],
  languages: ['en', 'pl', 'es'],
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  }
}
