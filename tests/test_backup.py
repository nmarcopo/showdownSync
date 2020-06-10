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

    """
    Backup one team.
    Only one team available, no teams in backup already.
    Tests that JSON is the same
    """
    def test_backup_noOtherBackups_json(self):
        # load an arbitrary team into showdown
        self.storage.set("showdown_teams", "gen8nationaldexag]Untitled 3|Zacian-Crowned||rustedsword|intrepidsword|swordsdance,playrough,closecombat,behemothblade|Jolly|,252,,,4,252|||||]Zacian-Crowned||rustedsword|intrepidsword|swordsdance,playrough,closecombat,behemothblade|Jolly|,252,,,4,252|||||]Gengar-Mega||gengarite|shadowtag|encore,nastyplot,sludgewave,shadowball|Timid|,,,252,4,252||,0,,,,|||]Arceus||lifeorb|multitype|extremespeed,stealthrock,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||]Arceus||lifeorb|multitype|extremespeed,substitute,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||]Arceus||lifeorb|multitype|extremespeed,substitute,shadowclaw,swordsdance|Adamant|4,252,,,,252|||||")
        self.bA.driver.refresh()
        self.bA.injectIframe() # The team will show up in the extension iframe
        self.bA.driver.switch_to.frame("backupFrame")
        teamToBackupJSON = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'localTeams')]/div/p")[0].get_attribute("innerText")
        # Click backup
        self.bA.driver.find_element_by_id("actionButton").click()
        self.bA.driver.implicitly_wait(5)
        # Check to make sure the item was backed up
        teamBackedUpJSON = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'syncedTeams')]/div/p")[0].get_attribute("innerText")
        assert teamToBackupJSON == teamBackedUpJSON, "Error, Backed up team JSON does not match original team JSON."

    """
    Destroy the test environment
    """
    def tearDown(self):
        self.bA.cleanUp()

if __name__ == "__main__":
    unittest.main(module="test_backup")