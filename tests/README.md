# Tests

These are some automated tests for the Showdown Team Sync extension. They're run on Travis CI using Selenium and the Chrome webdriver [here](https://travis-ci.org/github/nmarcopo/showdownSync). I'll probably write a short article on how I did this, since I haven't seen a whole lot of documentation online for testing Chrome extensions.

## TODO:

- [x] Test for correct JSON after backing up a team
- [ ] Test for buttons working correctly after backing up a team
- [ ] Test for correct team imported when restoring a team
- [ ] Test for buttons working correctly when restoring a team
- [ ] Test to make sure team is deleted correctly
- [ ] Test for buttons working correctly after deleting a team
- [ ] Test for search working correctly
- [ ] Write article about testing Chrome extensions