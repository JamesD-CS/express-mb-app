var express = require('express');
const db = require('../db.js');
var router = express.Router();
const { DateTime } = require("luxon");
const { v4: uuidv4 } = require('uuid');

router.use(express.json());

//Get list of all forums
router.get('/', async function(req, res, next) {
  try{
  const query = {
    // give the query a unique name
    name: 'get-forums',
    text: 'SELECT * FROM forums',
    
  }
  console.log(query);
  const result = await db.query(query)
  res.json(result.rows);

} catch (err) {
  console.error(err);
  res.status(500).send('Internal Server Error');
}
  
});

//Get all posts from forum
router.get('/:forum_id', async function(req, res, next) {
  forum_id = Number(req.params.forum_id);
  try {

    const query = {
      // give the query a unique name
      name: 'get-posts',
      text: 'SELECT * FROM posts WHERE forum_id = $1 AND title IS NOT NULL',
      values: [forum_id]
    }
    console.log(query);
    const result = await db.query(query)
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
  
});

//Get a post from forum
router.get('/:forum_id/:poster_id', async function(req, res, next) {
  let forum_id = Number(req.params.forum_id);
  let poster_id = req.params.poster_id;
  try {

    const get_post_query = {
      // give the query a unique name
      name: 'get-post',
      text: 'SELECT * FROM posts WHERE forum_id = $1 AND poster_id = $2',
      values: [forum_id, poster_id]
    }
    //console.log(get_post_query);
    const result = await db.query(get_post_query)
    let reply_ids = [result.rows[0].replies];
    //retrieve replies from db
    const replies_query = {
      text:'SELECT * FROM posts WHERE poster_id = ANY ($1)',
      values: reply_ids
    }
    // returns list of reply objects of retireved message
    const replies = await db.query(replies_query);
    console.log("replies",replies.rows);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
  
  
  
});

//Post message to forum
router.post('/:forum_id', async function(req, res, next) {
  let forum_id = Number(req.params.forum_id);
  let new_datetime = DateTime.now();
  let newuuid = uuidv4();
  console.log(req.body);
  
  const insert_query = {
    name: 'insert_message',
    text: 'INSERT INTO posts (forum_id, body, title, poster_id , post_time ) VALUES($1, $2, $3, $4, $5) ',
    values: [forum_id, req.body.body, req.body.title, newuuid, new_datetime]
  }
  console.log(insert_query);
  try{
    const result = await db.query(insert_query);
    console.log(result);
    res.status(201).send('Message Posted');

  } catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

});

//Post reply to message
router.post('/:forum_id/:post_id', async function(req, res, next) {
  let forum_id = Number(req.params.forum_id);
  let new_datetime = DateTime.now();
  let reply_uuid = uuidv4();
  let post_id = req.params.post_id
  
  //Insert reply to posts table
  const insert_query = {
    name: 'insert_message',
    text: 'INSERT INTO posts (forum_id, body, poster_id , post_time ) VALUES($1, $2, $3, $4) ',
    values: [forum_id, req.body.body, reply_uuid, new_datetime]
  }
  console.log(insert_query);
  try{
    const result = await db.query(insert_query);
    console.log(result);
    //res.status(201).send('Message Posted');

  } catch(error){
    console.error(error);
    //res.status(500).send('Internal Server Error');
  }

  //Add reply uuid to replies array of original post
  const update_reply = {
    text: 'UPDATE posts SET replies = array_append(replies, $1) WHERE poster_id = $2',
    values: [reply_uuid, post_id]
  };

  try{
    const result = await db.query(update_reply);
    console.log(result);
    res.status(201).send('Reply Posted');

  } catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

});

module.exports = router;
