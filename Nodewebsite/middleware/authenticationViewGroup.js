var express = require('express');

/* Setup middleware to check user's login and has edditing rights */
function checkUserLoggedIn (req, res, next) {
    req.userLoggedIn = false;
    req.errorConfig =  { description: 'group', query: 'groupId', id: req.query.groupId, endpoint: '/viewGroup', userLoggedIn: false };
    if ( !req.session.userStatus === "loggedIn") {
        res.render('pages/error', req.errorConfig);
        return;
    }
    //console.log("Setting userloggedin as true")
    req.userLoggedIn = true;
    next();
}

function checkUserHasAccess(req, res, next) {
  req.allowedAccess = false;
  let groupId = req.query.groupId;
  let userEmail = decodeURIComponent(req.session.userEmail);
  let truncatedGroups = req.knex
                          .select('group_id', 'email')
                          .from('groups');

  let collaboratorSummary = req.knex
                               .select('*')
                               .from({groups: truncatedGroups})
                               .union(function() {
                                 this.select({group_id: 'group_id', email: 'share_to_email'}).from('group_sharing')
                               });

  // Check user has editing rights
  req.knex
      .select('*')
      .from({summary: collaboratorSummary})
      .where({group_id: groupId || 0})
      // and email is the user's email or public
        .andWhere(function() {
            this.where({email: userEmail})
            .orWhere({email: "_public_all_users_"})
        })
      .then((collaborators)=> {
        console.log(collaborators)
        if (collaborators.length < 1) { // Fix for async
          res.render('pages/error', req.errorConfig);
          return;
        }
        console.log("Setting allowedAccess as true")
        req.allowedAccess = true;
        next();
      });
}

module.exports = checkUserHasAccess;

