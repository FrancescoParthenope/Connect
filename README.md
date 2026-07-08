# Connect
TechWeb Project

# Getting started
1) start with docker a mongodb container version 6.0 with the port 27017
2) create a .env file and save :
   1) MONGO_URI = url and port of mongodb server
   2) DB_NAME = for the name of the database (used connect_db)
   3) FRONTEND_URL = url and port of the frontend (for CORS)
   4) JWT_SECRET_KEY = the secret key to generate jwt token
   5) JWT_ACCESS_TOKEN_EXPIRE = number in days to let the token for the login up
3) start the server with flask launching connect.py with port 8000
4) start the frontend

# License
this project is released under the Apache 2.0 license

# Database
Used MongoDB for the database. 
there are duplications of elements inside it to 
improve performance for the query. Those duplications 
are done prevalently if not exclusively to elements
that are permanent or not prone to changing

## improvements to implement
actually the invitation code for the classrooms is generated
by the code in the service "classroom" and there is a while that check
if already exists (in case it exists is generated a new one).

A future implementation could use a unique index in MongoDB instead
so it will be the database itself that guarantees the unique invitation code
and there will be no problems in case a classroom it's casually generated
at the same time with the same invitation code.

for now this is good because there are a lot of code combination
and collision are unlikely to appear

# Code explanation

## Server side

### general
For the server was used Flask to manage the communication with the frontend
and for route management. In general the server was structured using blueprints
for improve modules separation and the routes to sort what the frontend
is requesting.
For the routes that have to be called only by authenticated users
it was used jwt_extended by flask.
There is a role separation between the routes and the services

### routes
the routes have the objective of being the interface between
server and frontend

the routes receive the payload from the frontend and
will translate datas received in the right type before passing
them to the service part of the server as they do when data
needs to be translated before being passed to the frontend as
JSON

### services
They have the business logic of the server.
It's the service that has the task of recovering and updating
documents in the MongoDB database, as well as prepare and pass
to the route what is requested.

the services, similarly to the routes, are separated by the role
and functions that they need to do.

functions from the business logic are inside they modules with the criteria
of doing separation by domain

Inside the files, the helper functions are at the end.
For theme was used the standard prefix of "_" to indicate that
are not to be used outside