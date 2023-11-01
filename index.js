import express from 'express';
const app = express();
import mysql from 'mysql';
import cors from 'cors';
import axios from'axios';
import bodyParser from'body-parser';

import {google} from 'googleapis';
import path from "path";
import fs from 'fs';
import pkg from 'google-auth-library';
const { OAuth2 } = pkg;

const CLIENT_ID = '522870014553-ifq49jpbpnv8rdgh2sfqou8jksmumpbs.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04pqlC-5Oni89CgYIARAAGAQSNwF-L9IrVwY1mdsFf4Hqm_ubnEwsMe-WqCTDiizrbaXywCq1wtF2E8QTlhrt-_3yqXUBEGJ7PmU';


const oauth2client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2client.setCredentials({refresh_token: REFRESH_TOKEN})

const drive = google.drive({
    version: 'v3',
    auth: oauth2client
})


let FILE_ID;
/* 
filepath which needs to be uploaded
Note: Assumes example.png file is in root directory, 
though this can be any filePath
*/


app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// MySQL database configuration
const db = mysql.createPool({
  host: 'samplevnshost.vnsventures.trackman.in', // MySQL server hostname
  user: 'roshini', // MySQL username
  password: 'roshini8398', // MySQL password
  database: 'vns_ventures', // MySQL database name
});


// Define a route to handle file details upload
// Inside the /upload-file-details route
app.post('/upload-file-details', (req, res) => {
    const { id, fileName, fileType, fileSize, uploadDate, contributor, profilePicture, views, favorites } = req.body;
    console.log("file at server", req.body);
  
  


// Create a SQL query to insert file details into the MySQL table
// const insertQuery = `INSERT INTO filedetails (id, fileName, fileType, fileSize, uploadDate, contributor, favorites) 
//                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
const insertQuery = `INSERT INTO filedetails (id, fileName, fileType, fileSize, uploadDate, contributor, profilePicture, views, favorites) 
                    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`;

  
    // Execute the SQL query
    db.query(
        insertQuery,
        [id, fileName, fileType, fileSize, contributor, profilePicture, views, favorites],
        (err, result) => {
          if (err) {
            console.error('Error inserting file details into the database:', err);
            res.status(500).send('Internal Server Error');
          } else {
            console.log('File details inserted into the database');
            res.status(200).send('File details uploaded successfully');
          }
        }
      );      
      
  });
  
// Define a route to retrieve file details
app.get('/get-file-details', (req, res) => {
    // Create a SQL query to select file details from the MySQL table
    const selectQuery = 'SELECT id, fileName, fileType, fileSize, uploadDate, contributor, profilePicture, views, favorites FROM filedetails';
  
    // Execute the SQL query to retrieve file details
    db.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error retrieving file details from the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // Send the retrieved file details as a JSON response
        res.json(results);
        console.log("results at get file details ",results)
      }
    });
  });
  app.delete('/delete-file/:id', (req, res) => {
    const fileId = req.params.id;
  
    // Create a SQL query to delete the file details with the given ID from the MySQL table
    const deleteQuery = 'DELETE FROM filedetails WHERE id = ?';
  
    // Execute the SQL query to delete the file details
    db.query(deleteQuery, [fileId], (err, result) => {
      if (err) {
        console.error('Error deleting file details from the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('File details deleted from the database');
        res.status(200).send('File deleted successfully');
      }
    });
    deleteFile(fileId)
  });
  
async function deleteFile(id) {
    try {
      const response = await drive.files.delete({
        fileId: id,
      });
      console.log(response.data, response.status);
    } catch (error) {
      console.log(error.message);
    }
  }
  // Route to handle inserting data

// Route to update likedUser for a file with a specific ID
app.put('/update-like-user/:id', (req, res) => {
    const { id } = req.params;
    const { likedUser } = req.body; // Assuming the likedUser is sent from the client
  
    // Update the database with the likedUser information for the file with the given ID
    // Example code (you should replace this with your database interaction)
    const sql = "UPDATE filedetails SET likedUser = ? WHERE id = ?";
    db.query(sql, [likedUser, id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ message: "likedUser updated successfully" });
      }
    });
  });
  // Express Route to update the favorites count for a specific file by ID
app.put('/update-favorites/:id', (req, res) => {
    const { id } = req.params;
    console.log("called update favorite ",id)
  
    // Assuming you have a database connection (like MySQL, PostgreSQL, etc.)
    // Replace this query with your actual database update operation
    db.query(
      'UPDATE filedetails SET favorites = favorites + 1 WHERE id = ?',
      [id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(200).json({ message: 'Favorites updated successfully' });
        }
      }
    );
  });
  app.put('/decrease-favorites-files/:id', (req, res) => {
    const { id } = req.params;
    console.log("called decrease favorite ",id)
   
    // Check if the favorite count is greater than 0 before decreasing it
    db.query(
      'UPDATE filedetails SET favorites = favorites - 1 WHERE id = ? AND favorites > 0',
      [id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(200).json({ message: 'Favorites updated successfully' });
        }
      }
    );
   });
   app.put('/decrease-favorite-blog/:id', (req, res) => {
    const { id } = req.params;
    console.log("called decrease favorite ",id)
   
    // Check if the favorite count is greater than 0 before decreasing it
    db.query(
      'UPDATE blogtable SET favorites = favorites - 1 WHERE id = ? AND favorites > 0',
      [id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(200).json({ message: 'Favorites updated successfully' });
        }
      }
    );
   });
   app.get('/get-favorite-count/:fileId', (req, res) => {
    const fileId = req.params.fileId;
  
    // Replace 'getFavoriteCountFromDatabase' with your actual function for getting the favorite count from the database
    const favoriteCount = getFavoriteCountFromDatabase(fileId);
  
    res.json({ favoriteCount });
  });   
  function getFavoriteCountFromDatabase(fileId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT favorites FROM filedetails WHERE id = ?',
        [fileId],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0].favorites);
          }
        }
      );
    });
  }
  
  
app.get('/get-blogs', (req, res) => {
    // Create a SQL query to select data from the 'blogtable'
    const selectQuery = 'SELECT id, title, subtitle, username, date, imageUrl, description, views, favorites, commentCount, profilepicture FROM blogtable';
  
    // Execute the SQL query to retrieve data
    db.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error retrieving data from the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // Send the retrieved data as a JSON response
        // console.log("results at get blog server ",results)
        res.json(results);
      }
    });
  });
app.post('/insertBlog', (req, res) => {
    const { id, title, subtitle, username, date, image, description, profilepicture } = req.body;
  console.log("blog at server ",req.body)
    const sql = 'INSERT INTO blogtable (id, title, subtitle, username, date, imageUrl, description, profilepicture) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)';
    const values = [id, title, subtitle, username, image, description, profilepicture];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting data into MySQL: ' + err);
        res.status(500).json({ message: 'Error inserting data' });
      } else {
        console.log('Data inserted into MySQL');
        res.status(200).json({ message: 'Data inserted successfully' });
      }
    });
  });
  app.delete('/delete-blog/:id', (req, res) => {
    const blogId = req.params.id;
  
    // Create a SQL query to delete the blog with the given ID from the 'blogtable'
    const deleteQuery = 'DELETE FROM blogtable WHERE id = ?';
  
    // Execute the SQL query to delete the blog
    db.query(deleteQuery, [blogId], (err, result) => {
      if (err) {
        console.error('Error deleting blog from the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Blog deleted from the database');
        res.status(200).send('Blog deleted successfully');
      }
    });
  });
  app.put('/update-blog/:id', (req, res) => {
    const blogId = req.params.id;
    const updatedBlogData = req.body; // The updated blog data received from the client
  
    // Create a SQL query to update the blog with the given ID in the 'blogtable'
    const updateQuery = 'UPDATE blogtable SET title=?, subtitle=?, imageUrl=?, description=? WHERE id = ?';
  
    // Execute the SQL query to update the blog
    db.query(updateQuery, [updatedBlogData.title, updatedBlogData.subtitle, updatedBlogData.imageUrl, updatedBlogData.description, blogId], (err, result) => {
      if (err) {
        console.error('Error updating blog in the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Blog updated in the database');
        res.status(200).send('Blog updated successfully');
      }
    });
  });


  app.get('/get-blog/:id', (req, res) => {
    const blogId = req.params.id;
  
    const selectBlogQuery = 'SELECT id, title, subtitle, username, date, imageUrl, description, views, favorites, commentCount, profilepicture  FROM blogtable WHERE id = ?';
    const selectCommentsQuery = 'SELECT id, commentText, timestamp FROM commenttable WHERE blogId = ?';
  
    db.query(selectBlogQuery, [blogId], (err, blogResult) => {
      if (err || blogResult.length === 0) {
        console.error('Error retrieving blog details from the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        db.query(selectCommentsQuery, [blogId], (err, commentsResult) => {
          if (err) {
            console.error('Error retrieving comments from the database:', err);
            res.status(500).send('Internal Server Error');
          } else {
            res.json({ blog: blogResult[0], comments: commentsResult });
          }
        });
      }
    });
  });
  app.put('/increment-view-file/:id', (req, res) => {
    const fileId = req.params.id;
    console.log("view count ", fileId);
  
    // Create a SQL query to increment the views count of the file with the given ID
    const updateQuery = 'UPDATE filedetails SET views = COALESCE(views, 0) + 1 WHERE id = ?';
  
    // Execute the SQL query to increment the views count
    db.query(updateQuery, [fileId], (err, result) => {
      if (err) {
        console.error('Error incrementing view count:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('View count incremented successfully');
        res.status(200).send('View count incremented successfully');
      }
    });
  });
  app.put('/increment-view-blog/:id', (req, res) => {
    const blogId = req.params.id;
    console.log("view count ", blogId);
  
    // Create a SQL query to increment the views count of the file with the given ID
    const updateQuery = 'UPDATE blogtable SET views = COALESCE(views, 0) + 1 WHERE id = ?';
  
    // Execute the SQL query to increment the views count
    db.query(updateQuery, [blogId], (err, result) => {
      if (err) {
        console.error('Error incrementing view count:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('View count incremented successfully');
        res.status(200).send('View count incremented successfully');
      }
    });
  });
  
  
  app.put('/increment-favorite-count/:id', (req, res) => {
    const blogId = req.params.id;
    
    // Create a SQL query to increment the favorites count of the blog with the given ID
    const updateQuery = 'UPDATE blogtable SET favorites = COALESCE(favorites, 0) + 1 WHERE id = ?';
    
    // Execute the SQL query to increment the favorites count
    db.query(updateQuery, [blogId], (err, result) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Favorite count incremented successfully');
        res.status(200).send('Favorite count incremented successfully');
      }
    });
  });
  app.put('/increment-favorite-files/:id', (req, res) => {
    const fileId = req.params.id;
    
    // Create a SQL query to increment the favorites count of the file with the given ID
    const updateQuery = 'UPDATE filedetails SET favorites = COALESCE(favorites, 0) + 1 WHERE id = ?';
    
    // Execute the SQL query to increment the favorites count
    db.query(updateQuery, [fileId], (err, result) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Favorite count incremented successfully');
        res.status(200).send('Favorite count incremented successfully');
      }
    });
  });
  
  app.post('/add-comment/:id', (req, res) => {
    const blogId = req.params.id;
    const commentText = req.body.text;
    console.log("blogid at add comment ",blogId)
  
    const insertQuery = 'INSERT INTO commenttable (blogId, commentText) VALUES (?, ?)';
  
    db.query(insertQuery, [blogId, commentText], (err, result) => {
      if (err) {
        console.error('Error adding comment:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // After successfully adding the comment, update the comment count
        updateCommentCount(blogId);
        console.log('Comment added successfully');
        res.status(200).send('Comment added successfully');
      }
    });
  
  });
  
  // Function to update the comment count in the blogtable
  function updateCommentCount(blogId) {
    const countQuery = 'SELECT COUNT(*) AS commentCount FROM commenttable WHERE blogId = ?';
  
    db.query(countQuery, [blogId], (err, result) => {
      if (err) {
        console.error('Error counting comments:', err);
      } else {
        const commentCount = result[0].commentCount;
        const updateCountQuery = 'UPDATE blogtable SET commentCount = ? WHERE id = ?';
  
        db.query(updateCountQuery, [commentCount, blogId], (err, updateResult) => {
          if (err) {
            console.error('Error updating comment count:', err);
          } else {
            console.log('Comment count updated successfully',updateCountQuery);
          }
        });
      }
    });
  }
   
  // Endpoint to get comments by blog ID
app.get('/get-comments/:id', (req, res) => {
    const blogId = req.params.id;
  
    // Fetch comments for the specified blog ID from the commenttable
    const sql = 'SELECT * FROM commenttable WHERE blogId = ?';
    db.query(sql, [blogId], (err, results) => {
      if (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
      } else {
        res.json(results);
      }
    });
    
  });
  // Add this route in your Express server file
  app.get('/download-file/:id', async (req, res) => {
    const fileId = req.params.id; // Extract the file ID from the request params
    console.log("called download server ", fileId);
  
    try {
      const publicUrl = await generatePublicUrl(fileId);
      res.status(200).json(publicUrl);
    } catch (error) {
      console.error('Error generating public URL:', error);
      res.status(500).send('Error generating public URL');
    }
  });
  
  async function generatePublicUrl(fileId) {
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
  
      const result = await drive.files.get({
        fileId: fileId,
        fields: 'webViewLink, webContentLink',
      });
  
      console.log(result.data); // Log the result data
  
      return {
        webViewLink: result.data.webViewLink,
        webContentLink: result.data.webContentLink,
      };
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
  
  
const port = 5005;

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
