# CSC-3100-FinalProject
This is the primary repo for the group project management app in CSC-3100

## TO-DO ##
 **General**
  
  - [ ] Web hooks
  - [ ] Ensure we meet accessiblity standards

    
* Add ons for login/ registration
  - [ ] Multifactor authentication (passport.js can help)
  - [ ] Remove the password validation as a pop up on the login page as we can make this less annoying to deal with.
  - [ ] Login should also check a DB or something similar for if the user is a professor or a student to give the proper redirect. 
  
### Design interface for user, student, and faculty. ###

**Student:**
 - [ ] Writing reviews
- [ ] selecting the group their in
- [ ] writing the reivew for group members.
- [ ] how to select group: by key from class then choose group.
- [ ]  Able to leave a group ( i think we should have a enforced "roster" that even if you leave they still show up until the professor removes them)
- [ ]  view teamates ( name, role?, email, prefered contact. )
- [ ]   members can take a survey FROM THE PROFESSOR on each of their teamates can be private or public
    *   (this could easily be created questions with html from a question template depending on whats passed by prof)
- [ ]   student optional: notifications for survey
- [ ]   Scores for your own reviews

 
**Professor:**
  - [ ] create classes 
  - [ ] be able to add students to a group from students in class
  - [ ]  create quesions for a survey
  - [ ] see all info on students and thier rating
  - [ ]  create questions of type: (multiple choice, likert, fill in blank, multi select)
  - [ ] see all responses and those that have not been completed
  - [ ]  needs to review questions BEFORE they go public if the professor chooses this as an option otherwise it is posted.
  - [ ]  Adjust scores as needed for  reviews - my thought for this one is that the professor could coushin someones bad review if it is undeserved.
