var express = require('express')
var router = express.Router()

router.post('/', function (req, res) {
    //let userLoggedIn = req.session.userStatus === "loggedIn";
    //console.log("ReachedRemoveGroupSamples");
    let groupId = req.body.groupId;
    let sampleIds = req.body.sampleId;
    sampleIds = sampleIds.split(',');

    req.knex('group_samples')
      .modify(function (queryBuilder) {
          queryBuilder.where({ group_id: groupId, sample_id: sampleIds[0] });
          for (i = 1; i < sampleIds.length; i++) {
            queryBuilder.orWhere({ group_id: groupId, sample_id: sampleIds[i] });
          }
      })
      .del()
      .then(() => {
        res.status(200).json({"message": "successfully removed from group"})
        return;
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({"message": "error deleting from group"})
        return;
      });
      return;

    /*
    if ( userLoggedIn ) {

    }

    res.status(401).json({"message": "permissions error - user not logged in"}) */

    // Include update time stamp here instead?
})

module.exports = router;
