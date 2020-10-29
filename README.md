# M3 - Curator App

<br>

## Description

Tinder-style app where the user likes/dislikes artworks from the Metropolitan Museum of Art's open access collection.

# Server / Backend

## Models

User model

```javascript
{
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  artworksLiked: [{type: Schema.Types.ObjectId, ref:'Artwork'}]
}
```

Artwork model

```javascript
 {
   title: {type: String, required: true},
   artist: {type: String, required: true},
   img: {type: String, required: true},
   artworkId: {type: String, required: true},
   usersLiked: [{type: Schema.Types.ObjectId,ref:'User'}]
 }
```

Session model

```javascript
 {
   userId: {type: Schema.Types.ObjectId, ref: 'User'},
   createdAt: {type: Date},
 }
```

<br>

## API Endpoints (backend routes)

| HTTP Method | URL                         | Request Body                         | Success status | Error Status | Description                                                                                                                     |
| ----------- | --------------------------- | ------------------------------------ | -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/auth/user`                | Saved session                        | 200            | 404          | Check if user is logged in and return profile page                                                                              |
| POST        | `/auth/signup`              | {name, email, password}              | 201            | 404          | Checks if fields not empty (422) and user not exists (409), then create user with encrypted password, and store user in session |
| POST        | `/auth/login`               | {email, password}                    | 200            | 401          | Checks if fields not empty (422), if user exists (404), and if password matches (404), then stores user in session              |
| POST        | `/auth/logout`              | (empty)                              | 204            | 400          | Logs out the user                                                                                                               |
| GET         | `/auth/user`                | {id}                                 | 200            | 400          | Retrieve user information, including user's liked artworks (populated)                                                          |
| POST        | `/auth/user/edit`           | {id, name, email}                    | 201            | 400          | Edits user's name and/or email                                                                                                  |
| POST        | `/auth/user/editCollection` | {id, artworksLiked, artworksRemoved} | 201            | 400          | Edits user's list of liked artworks                                                                                             |
| GET         | `/artwork/random`           | (empty)                              | 200            | 400          | Return random artwork from MetAPI                                                                                               |
| GET         | `/artwork/:id`              | {id}                                 | 200            | 400          | Return specific artwork from MetAPI                                                                                             |
| POST        | `/artwork/add`              | {id, userId}                         | 201            | 400          | Create new artwork in own database and add User to liked array                                                                  |
| GET         | `/artwork/liked`            | (empty)                              | 200            | 400          | Retrieves all liked artworks from own database                                                                                  |
| GET         | `/artwork/liked/:id`        | {id, userId}                         | 200            | 400          | Return specific artwork in own database                                                                                         |

<br>

## Links

### Trello/Kanban

[Trello](https://trello.com/b/ur4kECPk/project-m3-curator)

### Git

The url to your repository and to your deployed project

[Client repository Link](https://github.com/willemprins93/curator-client)

[Server repository Link](https://github.com/willemprins93/curator-server)

[Deployed App Link](http://heroku.com)

### Slides

The url to your presentation slides

[Slides Link](http://slides.com)
