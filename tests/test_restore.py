from util import BrowserActions, LocalStorage
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import StaleElementReferenceException
from time import sleep
import unittest

class TestRestore(unittest.TestCase):
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
        self.bA.injectIframe()
        self.bA.driver.switch_to.frame("backupFrame")
        # load an arbitrary team into extension sync storage
        teamJSON = '{"name":"Xerneas","format":"gen8nationaldexag","team":"Zacian-Crowned||rustedsword|intrepidsword|crunch,playrough,wildcharge,behemothblade|Jolly|,252,,,4,252|||||]Xerneas||powerherb|fairyaura|moonblast,geomancy,thunder,hiddenpowerfire|Modest|4,,,252,,252||,0,,,,|||]Marshadow||lifeorb|technician|rocktomb,spectralthief,shadowsneak,closecombat|Jolly|,252,,,4,252|||||]Arceus||leftovers|multitype|extremespeed,earthquake,shadowclaw,swordsdance|Adamant|252,252,,,,4|||||]Arceus||leftovers|multitype|extremespeed,earthquake,shadowclaw,swordsdance|Adamant|252,252,,,,4|||||]Kyogre-Primal||blueorb|primordialsea|originpulse,waterspout,icebeam,thunder|Timid|,,,252,4,252||,0,,,,|||","folder":""}'
        teamHash = self.bA.driver.execute_script(f"return hashTeam('{teamJSON}')")
        self.bA.driver.execute_script(f"chrome.storage.sync.set({{'{teamHash}': '{teamJSON}'}})")
        self.bA.driver.execute_script("window.location.reload()")
    
    """
    Restore one team.
    Only one team available, no teams in backup already.
    Tests that localstorage injection is the same
    """
    def test_restore_noOtherBackups_json(self):
        # Click restore
        self.bA.driver.find_element_by_id("nav-restore-tab").click()
        self.bA.driver.implicitly_wait(5)
        self.bA.driver.find_element_by_id("actionButton").click()
        self.bA.driver.implicitly_wait(5)
        # Check to make sure the item was restored
        self.bA.driver.switch_to.default_content()
        storage = LocalStorage(self.bA.driver)
        teams = storage.get("showdown_teams")
        expected_team = "gen8nationaldexag]Xerneas|Zacian-Crowned||rustedsword|intrepidsword|crunch,playrough,wildcharge,behemothblade|Jolly|,252,,,4,252|||||]Xerneas||powerherb|fairyaura|moonblast,geomancy,thunder,hiddenpowerfire|Modest|4,,,252,,252||,0,,,,|||]Marshadow||lifeorb|technician|rocktomb,spectralthief,shadowsneak,closecombat|Jolly|,252,,,4,252|||||]Arceus||leftovers|multitype|extremespeed,earthquake,shadowclaw,swordsdance|Adamant|252,252,,,,4|||||]Arceus||leftovers|multitype|extremespeed,earthquake,shadowclaw,swordsdance|Adamant|252,252,,,,4|||||]Kyogre-Primal||blueorb|primordialsea|originpulse,waterspout,icebeam,thunder|Timid|,,,252,4,252||,0,,,,|||"
        assert teams == expected_team, f"Error, team was not restored correctly.\nLocalstorage data: {teams}, expected: {expected_team}"

    """
    Restore one team.
    Only one team available, no teams in backup already.
    Tests that buttons are enabled/disabled properly after restoring up.
    The "restore" button should be disabled, the "delete" button should be enabled,
    and the "backup" button should be disabled.
    """
    def test_restore_noOtherBackups_buttons(self):
        # Click restore
        self.bA.driver.find_element_by_id("nav-restore-tab").click()
        self.bA.driver.implicitly_wait(5)
        self.bA.driver.find_element_by_id("actionButton").click()
        # implicitly waiting isn't enough here because the finding elements by xpath function doesn't wait for the classlist to populate.
        # we need to wait for this to happen
        # If there's a StaleElementReferenceException, get the elements again
        stale = True
        tries = 0
        while stale and tries < 5:
            try:
                [restoreButton, deleteButton] = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'syncedTeams')]/div/div/div/button")
                restoreButtonClassList = restoreButton.get_attribute("class").split()
                deleteButtonClassList = deleteButton.get_attribute("class").split()
                stale = False
            except StaleElementReferenceException:
                # Try to get the elements again up to 5 times
                tries += 1
                if tries >= 5:
                    raise Exception("Max stale element retries exceeded.")
        backupButtonClassList = self.bA.driver.find_elements_by_xpath("//ul[contains(@id,'localTeams')]/div/div/div/button")[0].get_attribute("class").split()
        # Check to make sure buttons are enabled/disabled correctly
        assert "disabled" in restoreButtonClassList and "disabled" not in deleteButtonClassList and "disabled" in backupButtonClassList, f"Error, buttons are not enabled/disabled correctly.\nrestoreButton class list: {restoreButtonClassList}, expected: btn disabled btn-secondary\ndeleteButton class list: {deleteButtonClassList}, expected: btn btn-danger\nbackupButton class list: {backupButtonClassList}, expected: btn disabled btn-secondary"

    """
    Destroy the test environment
    """
    def tearDown(self):
        self.bA.cleanUp()

if __name__ == "__main__":
    unittest.main(module="test_restore")