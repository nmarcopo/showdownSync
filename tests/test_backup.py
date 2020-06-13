from util import BrowserActions, LocalStorage
import unittest

class TestBackup(unittest.TestCase):
    """
    Prepare the test environment
    Load pokemonshowdown and inject extension iframe
    """
    def setUp(self):
        self.bA = BrowserActions()
        self.bA.setUpExtension()
        self.bA.setUpDriver()
        self.bA.loadExtensionId()
        self.bA.driver.get("https://play.pokemonshowdown.com")
        self.storage = LocalStorage(self.bA.driver)
        # load an arbitrary team into showdown
        self.storage.set("showdown_teams", "gen8nationaldexag]Untitled 3|Zacian-Crowned||rustedsword|intrepidsword|swordsdance,playrough,closecombat,behemothblade|Jolly|,252,,,4,252|||||]Zacian-Crowned||rustedsword|intrepidsword|swordsdance,playrough,closecombat,behemothblade|Jolly|,252,,,4,252|||||]Gengar-Mega||gengarite|shadowtag|encore,nastyplot,sludgewave,shadowball|Timid|,,,252,4,252||,0,,,,|||]Arceus||lifeorb|multitype|extremespeed,stealthrock,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||]Arceus||lifeorb|multitype|extremespeed,substitute,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||]Arceus||lifeorb|multitype|extremespeed,substitute,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||")
        self.bA.driver.refresh()
        self.bA.injectIframe() # The team will show up in the extension iframe
        self.bA.driver.switch_to.frame("backupFrame")
    
    """
    Backup one team.
    Only one team available, no teams in backup already.
    Tests that JSON is the same
    """
    def test_backup_noOtherBackups_json(self):
        teamToBackupJSON = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'localTeams')]/div/p")[0].get_attribute("innerText")
        # Click backup
        self.bA.driver.find_element_by_id("actionButton").click()
        self.bA.driver.implicitly_wait(5)
        # Check to make sure the item was backed up
        teamBackedUpJSON = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'syncedTeams')]/div/p")[0].get_attribute("innerText")
        assert teamToBackupJSON == teamBackedUpJSON, f"Error, Backed up team JSON does not match original team JSON.\nBacked up JSON: {teamBackedUpJSON}\nOriginal team JSON: {teamToBackupJSON}"

    """
    Backup one team.
    Only one team available, no teams in backup already.
    Tests that buttons are enabled/disabled properly after backing up.
    The "restore" button should be disabled, the "delete" button should be enabled,
    and the "backup" button should be disabled.
    """
    def test_backup_noOtherBackups_buttons(self):
        self.bA.driver.find_element_by_id("actionButton").click()
        self.bA.driver.implicitly_wait(5)
        # Check to make sure buttons are enabled/disabled correctly
        [restoreButton, deleteButton] = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'syncedTeams')]/div/div/div/button")
        restoreButtonClassList = restoreButton.get_attribute("class").split()
        deleteButtonClassList = deleteButton.get_attribute("class").split()
        backupButtonClassList = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'localTeams')]/div/div/div/button")[0].get_attribute("class").split()
        assert "disabled" in restoreButtonClassList and "disabled" not in deleteButtonClassList and "disabled" in backupButtonClassList, f"Error, buttons are not enabled/disabled correctly.\nrestoreButton class list: {restoreButtonClassList}, expected: btn disabled btn-secondary\ndeleteButton class list: {deleteButtonClassList}, expected: btn btn-danger\nbackupButton class list: {backupButtonClassList}, expected: btn disabled btn-secondary"

    """
    Destroy the test environment
    """
    def tearDown(self):
        self.bA.cleanUp()

if __name__ == "__main__":
    unittest.main(module="test_backup")