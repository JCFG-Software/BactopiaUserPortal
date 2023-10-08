var express = require('express')
var router = express.Router()

router.get('/groups', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let emailValue = req.session.userEmail;
    let email = decodeURIComponent(emailValue);

    let groups = [];
    let haveGroups = false;

    if ( userLoggedIn ) {
      let getGroupCount = req.knex
                          .select('group_id as sample_group_id', req.knex.raw('COUNT(sample_id) as count'))
                          .from('group_samples')
                          .groupBy('sample_group_id')
                          .as('group_samples');

      // Get public groups _all_users_
      let getPublicGroupIds = req.knex
                              .select('group_id')
                              .from('group_sharing')
                              .where({share_to_email: '_public_all_users_'});

      // Get shared groups
      let getSharedGroupIds = req.knex
                              .select('group_id')
                              .from('group_sharing')
                              .where({share_to_email: email});

      let getGroupInfo = req.knex
                            .select('*')
                            .from('groups')
                            .leftJoin(getGroupCount, 'groups.group_id', 'group_samples.sample_group_id')
                            .where({email: email});

      let getpublicGroups = req.knex
                                  .select('*')
                                  .from('groups')
                                  .leftJoin(getGroupCount, 'groups.group_id', 'group_samples.sample_group_id')
                                  .where('group_id', 'in', getPublicGroupIds);

      let getsharedGroups = req.knex
                                  .select('*')
                                  .from('groups')
                                  .leftJoin(getGroupCount, 'groups.group_id', 'group_samples.sample_group_id')
                                  .whereNot({email: email})
                                  .where('group_id', 'in', getSharedGroupIds);

      Promise.all([getGroupInfo, getpublicGroups, getsharedGroups,]).then(function([userGroups, publicGroups, sharedGroups]) {
        console.log(userGroups);
        for (i = 0; i < userGroups.length; i++) {
          if (userGroups[i].count == undefined) {
            userGroups[i].count = 0;
          }
          if (userGroups[i].description.length >= 100) {
            userGroups[i].description = `${userGroups[i].description.substring(0,100)}...`;
          }
        }

        console.log(publicGroups);
        for (i = 0; i < publicGroups.length; i++) {
          if (publicGroups[i].count == undefined) {
            publicGroups[i].count = 0;
          }
          if (publicGroups[i].description.length >= 100) {
            publicGroups[i].description = `${publicGroups[i].description.substring(0,100)}...`;
          }
        }

        console.log(sharedGroups);
        for (i = 0; i < sharedGroups.length; i++) {
          if (sharedGroups[i].count == undefined) {
            sharedGroups[i].count = 0;
          }
          if (sharedGroups[i].description.length >= 100) {
            sharedGroups[i].description = `${sharedGroups[i].description.substring(0,100)}...`;
          }
        }

        res.render('pages/groups', {
            userLoggedIn: userLoggedIn,
            groups: userGroups,
            publicGroups: publicGroups,
            sharedGroups: sharedGroups,
            haveGroups: true
        });

      })
      .catch(function(err) {
        console.log(err);
      });

    }
    else{
        res.render('pages/error', {error: 'Not Logged In'});
    }
})


router.post('/updateGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    console.log("user logged in: " + userLoggedIn);
    let groupId = req.body.groupId;
    let title = req.body.title;
    let description = req.body.description;
    let updateTime = req.body.modified;

    let update = {};
    if ( title != undefined ) {
      update["name"] = title;
    }

    if ( description != undefined ) {
      update["description"] = description;
    }

    if ( updateTime != undefined ) {
      update["modified"] = updateTime;
    }

    console.log(update);
    if ( userLoggedIn ) {
      req.knex('groups')
        .where({ group_id: groupId })
        .update(update)
        .then(() => {
          res.status(200).json({"message": "successfully updated group"})
          return;
        })
        .catch((err) => {
          console.log(err);
          res.status(401).json({"message": "error updating group"})
          return;
        });
        return;
    }
    else{
        res.redirect('/error', {error: 'Not Logged In'});
    }
})

module.exports = router;
