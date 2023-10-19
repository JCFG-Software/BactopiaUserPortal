var express = require('express')
var router = express.Router()
const log = require('debug')('routes:removeGroup')

/**
    * POST Remove Group
    * @param {string} groupId - The id of the group to be removed
    */
router.post('/', function (req, res) {
  let groupId = req.body.groupId;

  req.knex('groups')
    .where({ group_id: groupId })
    .del()
    .then(() => {
      res.status(200).json({"message": "successfully removed group"})
      return;
    })
    .catch((err) => {
        log(err)
        res.status(500).json({"message": "error removing group"})
      return;
    });
  return;
})

module.exports = router;
