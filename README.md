# MUN-chat 
Motivation: Since our cultural fest in 2016, we wanted to move most of the on paper stuff done in our college to a better online system, that would save human time and efforts and would help in keeping everything on track.

This chit passing application built for VITCMUN 2017 stands for the above idea and removed the system of using paper chits to transfer information within the councils.

### Development Setup
I have used Babel for transpiling some ES6 features to ES5 code.
+ Make sure babel-cli is installed using ``` npm install -g babel-cli ```
+ Package manager being used is yarn, although you can use npm.
+ Run ```yarn``` and all packages will be installed.
+ Run ```npm run build``` and the source code will be transpiled into **lib** folder
+ Make sure mongodb is installed if not, then refer mongodb documentation on installing it on your local machine. With the MongoDB running,
+ ``` npm run db ```
+ Finally ``` npm start ```
+ The application will be runnning at port 9876.

### Sample login usage:
Open any two browser windows and use the following information:
+ **combo1**
    +   ``` username: Australia, password: 3 ```
+ **combo2**
    + ```username: France, password: 9```

**Note:** If you find any issues in setting up the repo or find any bugs, feel free to post an issue.


