# dance-volunteering
Volunteering system for the Ottawa Swing Dance Society. Live at https://schlachter.ca/dance-vol/.

Shifts are generated from a template Mondays at 00:00 (Sunday midnight). Volunteers can log in with Google, Facebook, or Microsoft and sign up for a shift. Admins can see contact information for volunteers and receive an automatic email at 17:00 on Friday with the volunteering schedule.


## List of features (with current status):

Accounts
--------
(An account is only required to volunteer for a shift)
- [X] A user can log in with Facebook
- [X] A user can log in with Google
- [X] A user can log in with Microsoft

Volunteering
------------
- [X] A user can see shifts taken/available
- [X] User can sign up for a shift (only one each week)
- [X] User can cancel their own shift (only their own)
- [ ] New users can only sign up for a shift with an exec
- [ ] User can contact osdsvol@gmail.com

Email
-----
- [X] Users and admins can manage their email preferences
- [X] User can be reminded of their shift by email
- [X] User gets a thank-you email
- [X] User gets an email when shifts become available (Monday)
- [X] Admin is notified of shifts on Friday

Exec
----
- [X] Admin can get more information on users (to contact them)
- [X] Admin can add or remove other admins
- [X] Admin can cancel a shift
- [ ] Admin can customize the volunteering template
- [X] Admin can cancel a week


Backend
-------
(Need a database for users, and a database for volunteering info)
- [X] Shifts become read-only Friday evening
- [X] Shifts for new week become available early in the week (Monday?)
