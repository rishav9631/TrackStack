const express = require('express');
const router = express.Router();
const {
    getConfig,
    getConfigRaw,
    updateConfig,
    testMongoConnection,
} = require('../controllers/configController');

router.get('/', getConfig);
router.get('/raw', getConfigRaw);
router.put('/', updateConfig);
router.post('/test-mongo', testMongoConnection);

module.exports = router;
