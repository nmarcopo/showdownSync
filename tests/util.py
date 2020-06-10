import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import shutil, errno
from time import sleep
import unittest

class BrowserActions:
    def __init__(self, extensionDir='../extension', testExtensionDir='testExtension',
                manifestPath='manifest.json', extensionPage="chrome://extensions",
                mainPage="https://play.pokemonshowdown.com"):
        
        self.extensionDir = extensionDir
        self.testExtensionDir = testExtensionDir
        self.manifestPath = manifestPath

        self.extensionPage = extensionPage
        self.extensionQuery = 'return document.querySelector("extensions-manager").shadowRoot.querySelector("#items-list").shadowRoot.querySelectorAll("extensions-item")[1].id'

        self.mainPage = mainPage

    # from https://stackoverflow.com/questions/1994488/copy-file-or-directories-recursively-in-python
    def _copyanything(self, src, dst):
        try:
            shutil.copytree(src, dst)
        except OSError as exc: # python >2.5
            if exc.errno == errno.ENOTDIR:
                shutil.copy(src, dst)
            else: raise

    def setUpExtension(self):
        self._copyanything(self.extensionDir, self.testExtensionDir)
        # copy the manifest with looser permissions for use in testing
        shutil.copy2(self.manifestPath, self.testExtensionDir)

    def setUpDriver(self):
        chrome_options = Options()
        chrome_options.add_argument('load-extension=' + self.testExtensionDir)
        # Can't use chrome headless with browser extensions. See bug:
        # https://bugs.chromium.org/p/chromium/issues/detail?id=706008#c5
        # chrome_options.add_argument('--headless')
        self.driver = webdriver.Chrome(options=chrome_options)

    def loadExtensionId(self):
        self.driver.get(self.extensionPage)
        self.driver.implicitly_wait(5)
        self.extension_id = self.driver.execute_script(self.extensionQuery)

    def injectIframe(self):
        iframeContent = f'''
let frame = document.createElement("iframe");
frame.setAttribute("src", "chrome-extension://{self.extension_id}/popup.html");
frame.setAttribute("width", "500");
frame.setAttribute("height", "500");
frame.setAttribute("name", "backupFrame");
document.querySelector("div.pad").parentElement.insertBefore(frame, document.querySelector("div.pad").parentElement.firstChild);
'''
        self.driver.execute_script(iframeContent)

    def cleanUp(self):
        self.driver.quit()
        shutil.rmtree(self.testExtensionDir)


# Localstorage class from the following stackoverflow question:
# https://stackoverflow.com/questions/46361494/how-to-get-the-localstorage-with-python-and-selenium-webdriver
class LocalStorage:

    def __init__(self, driver) :
        self.driver = driver

    def __len__(self):
        return self.driver.execute_script("return window.localStorage.length;")

    def items(self) :
        return self.driver.execute_script( \
            "var ls = window.localStorage, items = {}; " \
            "for (var i = 0, k; i < ls.length; ++i) " \
            "  items[k = ls.key(i)] = ls.getItem(k); " \
            "return items; ")

    def keys(self) :
        return self.driver.execute_script( \
            "var ls = window.localStorage, keys = []; " \
            "for (var i = 0; i < ls.length; ++i) " \
            "  keys[i] = ls.key(i); " \
            "return keys; ")

    def get(self, key):
        return self.driver.execute_script("return window.localStorage.getItem(arguments[0]);", key)

    def set(self, key, value):
        self.driver.execute_script("window.localStorage.setItem(arguments[0], arguments[1]);", key, value)

    def has(self, key):
        return key in self.keys()

    def remove(self, key):
        self.driver.execute_script("window.localStorage.removeItem(arguments[0]);", key)

    def clear(self):
        self.driver.execute_script("window.localStorage.clear();")

    def __getitem__(self, key) :
        value = self.get(key)
        if value is None :
            raise KeyError(key)
        return value

    def __setitem__(self, key, value):
        self.set(key, value)

    def __contains__(self, key):
        return key in self.keys()

    def __iter__(self):
        return self.items().__iter__()

    def __repr__(self):
        return self.items().__str__()