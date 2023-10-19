var express = require('express')
var router = express.Router()
const bcrypt = require('bcrypt');

/**
 * GET account page
    * Page with basic information about a user, with options to update information
    * @module routes/account
    * @requires express
 */ 
router.get('/', async function(req, res) {

    const userLoggedIn = req.session.userStatus === "loggedIn";
    if (!userLoggedIn) {
        res.redirect('/login');
        return;
    }

    // get all the info
    // 1. Name/email
    // 2. Metadata contributions
    // 3. Groups
    // 4. Favourites

    const user = (await req.knex.select('name', 'email', 'organisation', 'occupation').from('registered_users').where({ email: decodeURIComponent(req.session.userEmail) }))?.[0];
    if (!user) {
        res.redirect('/login');
        return;
    }

    // metadata contributions is just a heap of sampleIds and dates
    const metadataContributions = await req.knex.select('sample_id', 'created').from('metadata').where({ email: decodeURIComponent(req.session.userEmail) });

    // we want the group name, created date, and number of samples for each group
    //  accessGroups : shared with user
    //  createdGroups : created by user
    //  group name, created date are in the groups table
    //  number of samples is the sum of the group_samples table (with the correct group_id)
    //  access groups are in the group_sharing table (to get other info have to join with groups table)
    const accessGroups = await req.knex
        .raw(`SELECT groups.group_id, groups.name, groups.created, COUNT(group_samples.sample_id) AS num_samples, 'Member' AS type
            FROM groups
            INNER JOIN group_sharing ON groups.group_id = group_sharing.group_id
            INNER JOIN group_samples ON groups.group_id = group_samples.group_id
            WHERE group_sharing.share_to_email = ?
            GROUP BY groups.group_id, groups.name, groups.created`, [decodeURIComponent(req.session.userEmail)]);
    const createdGroups = await req.knex
        .raw(`SELECT groups.group_id, groups.name, groups.created, COUNT(group_samples.sample_id) AS num_samples, 'Owner' AS type
            FROM groups
            INNER JOIN group_samples ON groups.group_id = group_samples.group_id
            WHERE groups.email = ?
            GROUP BY groups.group_id, groups.name, groups.created`, [decodeURIComponent(req.session.userEmail)]);
    const groups = accessGroups.rows.concat(createdGroups.rows);

    // favourites is just a heap of sampleIds
    const favourites = await req.knex.select('sample_id').from('user_favorites').where({ email: decodeURIComponent(req.session.userEmail) });

    res.render("pages/account",
        {
            userLoggedIn,
            user, stylesheets: ["accountStyles.css"],
            metadataContributions,
            groups,
            favourites,
            success: req.query.success,
            error: req.query.error
        }
    );

});

/**
    * POST account page
    * For updating user information
    * @name POST/account
*/
router.post('/', async function(req, res) {
    // the user may update their password, name, organisation, occupation, or email
    //  - in any case, we need to check the given password is correct
    //  - if their email is updated, 
    //      - we need to check that the new email is not already in use
    //      - we need to update the email in all the places it is used (groups, favourites, metadata etc.) 
    //  - if their password is updated, we need to hash it
    //  - if their name, organisation, or occupation is updated, we just update users table
    let success, error;
    const {
        name = null, 
        email = null, 
        organisation = null, 
        occupation = null, 
        password, 
        newPassword = null} = req.body;

    const user = (await req.knex.select('name', 'email', 'organisation', 'occupation', 'password').from('registered_users').where({ email: decodeURIComponent(req.session.userEmail) }))?.[0];
    if (!user) {
        res.redirect('/login');
        return;
    }

    // check password
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
        error = encodeURIComponent('Incorrect password');
        res.redirect(`/account?error=${error}`);
        return;
    }
    // correct password, check if email was updated
    if (email && email !== user.email) {
        // check if email is already in use
        const emailInUse = (await req.knex.select('email').from('registered_users').where({ email: email }))?.[0];
        if (emailInUse) {
            error = encodeURIComponent('Email already in use');
            res.redirect(`/account?error=${error}`);
            return;
        }
    }
    // save the shiny new user details
    const newUser = {
        name: name || user.name,
        email: email || user.email,
        organisation: organisation || user.organisation,
        occupation: occupation || user.occupation,
        password: newPassword ? await bcrypt.hash(newPassword, 10) : user.password
    };
    await req.knex('registered_users').where({email: decodeURIComponent(req.session.userEmail)}).update(newUser);
    // update the session
    req.session.userEmail = newUser.email;
    success = encodeURIComponent('Account updated successfully');
    res.redirect(`/account?success=${success}`);

});


module.exports = router;
