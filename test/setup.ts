import chai from 'chai';
import sinonChai from 'sinon-chai';

// Set up chai plugins
chai.use(sinonChai);

// Set up any global test environment configuration here
before(() => {
  // This runs once before all tests
  console.log('Setting up server test environment');
  
  // Add any global setup here
  // For example, you might want to mock Node.js modules
  // or set up test database connections
});

after(() => {
  // This runs once after all tests
  console.log('Tearing down server test environment');
  
  // Add any global teardown here
  // For example, closing database connections
});