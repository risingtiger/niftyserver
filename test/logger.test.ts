import { expect } from 'chai';
import * as sinon from 'sinon';
import { Save, Get } from '../src/logger.js';

describe('Logger', () => {
  let mockDb: any;
  let mockCollection: any;
  let mockBatch: any;
  let mockQuery: any;
  let mockSnapshot: any;
  
  beforeEach(() => {
    // Create mock for Firestore
    mockBatch = {
      set: sinon.stub(),
      commit: sinon.stub().resolves()
    };
    
    mockQuery = {
      limit: sinon.stub().returnsThis(),
      get: sinon.stub().resolves({
        docs: [
          {
            id: 'log1',
            data: () => ({
              user_email: 'test@example.com',
              device: 'desktop',
              browser: 'chrome',
              type: 1,
              subject: 'Test Subject',
              msg: 'Test Message',
              ts: 1620000000 // Unix timestamp
            })
          },
          {
            id: 'log2',
            data: () => ({
              user_email: 'test@example.com',
              device: 'mobile',
              browser: 'safari',
              type: 2,
              subject: 'Error',
              msg: 'Something went wrong',
              ts: 1620001000 // Unix timestamp
            })
          }
        ]
      })
    };
    
    mockCollection = {
      doc: sinon.stub().returns({}),
      where: sinon.stub().returnsThis()
    };
    
    mockCollection.where.withArgs('user_email', '==', 'test@example.com').returns(mockQuery);
    
    mockDb = {
      collection: sinon.stub().returns(mockCollection),
      batch: sinon.stub().returns(mockBatch)
    };
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('Save', () => {
    it('should save logs to Firestore', async () => {
      // Test data
      const userEmail = 'test@example.com';
      const device = 'desktop';
      const browser = 'chrome';
      const logsString = '1,Login,User logged in,1620000000--2,Error,Failed to load data,1620001000';
      
      // Execute
      const result = await Save(mockDb, userEmail, device, browser, logsString);
      
      // Assertions
      expect(mockDb.collection.calledWith('logs')).to.be.true;
      expect(mockDb.batch.calledOnce).to.be.true;
      expect(mockBatch.set.calledTwice).to.be.true; // Two log entries
      expect(mockBatch.commit.calledOnce).to.be.true;
      expect(result).to.equal(1);
    });
    
    it('should handle empty logs string', async () => {
      // Test with empty string
      const result = await Save(mockDb, 'test@example.com', 'desktop', 'chrome', '');
      
      // Should still create a batch but not call set
      expect(mockDb.batch.calledOnce).to.be.true;
      expect(mockBatch.commit.calledOnce).to.be.true;
      expect(result).to.equal(1);
    });
  });
  
  describe('Get', () => {
    it('should retrieve logs for a user', async () => {
      // Execute
      const result = await Get(mockDb, 'test@example.com');
      
      // Assertions
      expect(mockDb.collection.calledWith('logs')).to.be.true;
      expect(mockCollection.where.calledWith('user_email', '==', 'test@example.com')).to.be.true;
      expect(mockQuery.limit.calledWith(10000)).to.be.true;
      expect(mockQuery.get.calledOnce).to.be.true;
      
      // Check that CSV includes header and two log entries
      expect(result).to.include('user_email,device,browser,type,subject,msg,datetime');
      expect(result).to.include('test@example.com,desktop,chrome,1,Test Subject,Test Message');
      expect(result).to.include('test@example.com,mobile,safari,2,Error,Something went wrong');
    });
    
    it('should return null if query fails', async () => {
      // Make the query fail
      mockQuery.get = sinon.stub().rejects(new Error('Query failed'));
      
      // Execute
      const result = await Get(mockDb, 'test@example.com');
      
      // Should return null on error
      expect(result).to.be.null;
    });
  });
});