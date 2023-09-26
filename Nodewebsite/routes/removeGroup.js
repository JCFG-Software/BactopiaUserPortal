var express = require('express')
var router = express.Router()
let url = require('url')

router.post('/', function (req, res) {
  let groupId = req.body.groupId;
  console.log(groupId);

  console.log("=============================================================");
  req.knex('groups')
    .where({ group_id: groupId })
    .del()
    .then(() => {
      console.log("GROUP DELETED")
      res.status(200).json({"message": "successfully removed group"})
      return;
    })
    .catch((err) => {
      console.log(err);
      res.status(401).json({ "message": "error deleting group" })
      return;
    });
  return;
})

module.exports = router;
