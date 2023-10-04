var express = require('express')
var router = express.Router()
let url = require('url')
const getGatherData = require("../utils/getGatherData");
const getMLST = require("../utils/getMLST");
const log = require("debug")("routes:viewGroup");

router.get('/', async function (req, res, next) {
    const groupId = req.query.groupId;
    const userLoggedIn = req.session.userStatus === "loggedIn";
    let errorPageConfig = { description: 'group', query: 'groupId', id: groupId, endpoint: '/viewGroup', userLoggedIn: req.userLoggedIn };
    //console.log(errorPageConfig);
    if (req.allowedAccess == true) {
      try {
        let getGroupsInfo = req.knex
                                .select('*')
                                .from('groups')
                                .where({group_id: groupId || 0});

        let getSampleIds = req.knex
                              .select('sample_id')
                              .from('group_samples')
                              .where({group_id: groupId || 0});

        let getSharingInfo = req.knex
                             .select('share_to_email')
                             .from('group_sharing')
                             .where({group_id: groupId || 0})

        Promise.all([getGroupsInfo, getSampleIds, getSharingInfo]).then(async function([groupInfo, sampleIds, sharingInfo]) {
          groupInfo = groupInfo[0];
          if (sampleIds.length < 1) {
            sampleIds = [];
          }
          let status = "Your"; // Tag group status for user
          if (sharingInfo.length >= 1) {
            status = "Private";
            //console.log(sharingInfo);
            let cleanedSharingInfo = [];
            sharingInfo.forEach(function(share) {
              cleanedSharingInfo.push(share.share_to_email);
              //console.log(share.share_to_email);
              if (share.share_to_email == "_public_all_users_") {
                status = "Public";
                //sharingInfo = [];
                //console.log("set to public");
              }
            });
            sharingInfo = cleanedSharingInfo;
          }
          groupInfo.status = status;
            const allSamples = sampleIds.map((sample) => {
                const sampleData = getGatherData(sample.sample_id);
                const mlst = getMLST(sample.sample_id);
                return {
                      id: sample.sample_id,
                      length: sampleData?.genome_size,
                      species: sampleData?.species,
                      sequenceType: mlst?.sequence_type
                }
            });
            // Loop through each sample in allSamples and append metadata from knex
            for (const samples of allSamples) {
              const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes').from('metadata')
              .where({sample_id: samples.id}).orderBy('created', 'desc');
              if (metadatas.length == 0) {
                  metadatas.push({isolation_host: 'Unknown', isolation_source: 'Unknown', isolation_location: 'Unknown', time_of_sampling: 'Unknown', notes: 'None'})
              }
              samples.host = metadatas[0].isolation_host
              samples.source = metadatas[0].isolation_source
              samples.location = metadatas[0].isolation_location
              samples.time = metadatas[0].time_of_sampling
              samples.notes = metadatas[0].notes
            }
          res.render('pages/viewGroup', {
            userLoggedIn,
            samples: allSamples,
            groupInfo: groupInfo,
            sharingInfo: sharingInfo,
            email: req.session.userEmail
            });
        })
        .catch(function(err) {
          console.log(err);
          res.render('pages/error', errorPageConfig);
        });

      } catch (err) {
          res.render('pages/error', errorPageConfig);
      }
    }
    else{
        console.log("User does not have permission to access group");
        res.render('pages/error', errorPageConfig);
    }
    return;
})


router.post('/removeGroup', function (req, res) {
  let userLoggedIn = req.session.userStatus === "loggedIn";
  let groupId = req.body.groupId;
  //console.log(groupId);

  //console.log(userLoggedIn);
  if (userLoggedIn) {

    //console.log("=============================================================");
    req.knex('groups')
      .where({ group_id: groupId })
      .del()
      .then(() => {
        //console.log("GROUP DELETED")
        res.status(200).json({"message": "successfully removed group"})
        return;
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({ "message": "error deleting group" })
        return;
      });
    return;
  }
  res.status(401).json({"message": "permissions error - user not logged in"})
// })
})

module.exports = router;
