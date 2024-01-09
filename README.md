# dance-volunteering
Volunteering system for the Ottawa Swing Dance Society. Live at https://volunteer.swingottawa.ca.

Shifts are generated from a template Sundays at 12:00 PM (noon). Volunteers can log in with Google and sign up for a shift. Admins can see contact information for volunteers and receive an automatic email at 17:00 on Friday with the volunteering schedule.


## List of features (with current status):

Accounts
--------
(An account is only required to volunteer for a shift)
- [X] A user can log in with Google

Volunteering
------------
- [X] A user can see shifts taken/available
- [X] User can sign up for a shift (only one each week)
- [X] User can cancel their own shift (only their own)
- [X] New users can only sign up for a shift with an exec (configurable in volunteering template)
- [X] User can contact osdsvol@gmail.com

Email
-----
- [X] Users and admins can manage their email preferences
- [X] User can be reminded of their shift by email
- [X] User gets an email when shifts become available (Sunday)
- [X] Admin is notified of shifts on Friday

Exec
----
- [X] Admin can get more information on users (to contact them)
- [X] Admin can add or remove other admins
- [X] Admin can cancel a shift
- [X] Admin can customize the volunteering template
- [X] Admin can cancel a week


Backend
-------
(Need a database for users, and a database for volunteering info)
- [X] Shifts become read-only Friday evening
- [X] Shifts for new week become available early in the week (Sunday 12 PM)
