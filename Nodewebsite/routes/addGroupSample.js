var express = require('express')
var router = express.Router()

router.post('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupId = req.body.groupId;
    let sampleId = req.body.sampleId;

    if ( userLoggedIn ) {
        req.knex('group_samples')
            .insert({
                group_id: groupId,
                sample_id: sampleId
            }).onConflict(['group_id', 'sample_id']).ignore()
            .then( () => {
                    req.knex('groups')
                        .where({group_id: groupId})
                        .update({modified: new Date(Date.now()).toISOString()})
                        .then(() => {
                            console.log("Success")
                            res.status(200).json({"message": "successfully added to group"})
                        })
                        .catch((err) => {
                            console.log("error updating")
                            res.status(401).json({"message": "Error updating group"})
                        })
                }
            )
            .catch((err) => {
                console.log("error adding")
                console.log(err);
                res.status(401).json({"message": "Error adding sample"})
            })
    }
})

module.exports = router;
