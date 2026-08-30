const express = require('express');
const router = express.Router();
const {
    getConfig,
    getConfigRaw,
    updateConfig,
    testMongoConnection,
    seedMasterUser,
    removeSeededUsers,
    getSeededUsers,
} = require('../controllers/configController');

router.get('/', getConfig);
router.get('/raw', getConfigRaw);
router.put('/', updateConfig);
router.post('/test-mongo', testMongoConnection);
router.post('/seed-master', seedMasterUser);
router.post('/remove-seeded', removeSeededUsers);
router.get('/seeded-users', getSeededUsers);

module.exports = router;
