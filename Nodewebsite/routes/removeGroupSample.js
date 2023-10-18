var express = require('express')
var router = express.Router()
const log = require('debug')('routes:removeGroupSample')

/**
    * POST Remove Group Sample
    */
router.post('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupId = req.body.groupId;
    let sampleIds = req.body.sampleId;
    sampleIds = sampleIds.split(',');

    if(userLoggedIn){
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
            })
            .catch((err) => {
                log(err)
                res.status(401).json({"message": "error deleting from group"})
            });
    }
})

module.exports = router;
