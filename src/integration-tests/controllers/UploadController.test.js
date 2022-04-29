const chai = require('chai');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const { mockReq, mockRes } = require('sinon-express-mock');
const frisby = require('frisby');
const fs = require('fs');
const path = require('path');
const UploadController = require('../../api/controllers/UploadController');

chai.use(sinonChai);

describe('UploadController', async () => {
  describe('upload', async () => {
    const res = mockRes();

    it('should upload an image', async () => {
      const photoFile = path.resolve(__dirname, '../../../src/uploads/ratinho.jpg');
      const content = fs.createReadStream(photoFile);
      const formData = frisby.formData();

      formData.append('image', content);

      const req = mockReq({ headers: { } });

      const next = sinon.stub();

      await UploadController.upload(req, res, next);

      expect(next.calledOnce).to.be.true;
    });
  });
});